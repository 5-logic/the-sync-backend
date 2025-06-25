import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateStudentDto } from '@/students/dto/create-student.dto';
import { ImportStudentDto } from '@/students/dto/import-student.dto';
import { ToggleStudentStatusDto } from '@/students/dto/toggle-student-status.dto';
import { UpdateStudentDto } from '@/students/dto/update-student.dto';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UserService } from '@/users/user.service';

import {
	EnrollmentStatus,
	PrismaClient,
	SemesterStatus,
} from '~/generated/prisma';

@Injectable()
export class StudentService {
	private readonly logger = new Logger(StudentService.name);
	private static readonly TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Validate that a semester exists and is in the correct status for student enrollment
	 */
	private async validateSemesterForEnrollment(semesterId: string) {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});
		if (!semester) {
			throw new NotFoundException(`Semester with ID ${semesterId} not found`);
		}

		// Only allow enrollment when semester is in Preparing or Picking status
		if (
			semester.status !== SemesterStatus.Preparing &&
			semester.status !== SemesterStatus.Picking
		) {
			throw new ConflictException(
				`Cannot add students to semester ${semesterId}. Semester status is ${semester.status}. Only ${SemesterStatus.Preparing} and ${SemesterStatus.Picking} semesters allow student enrollment.`,
			);
		}

		return semester;
	}

	/**
	 * Validate that a major exists for student enrollment
	 */
	private async validateMajorForEnrollment(majorId: string) {
		const major = await this.prisma.major.findUnique({
			where: { id: majorId },
		});

		if (!major) {
			throw new NotFoundException(`Major with ID ${majorId} not found`);
		}

		return major;
	}

	/**
	 * Create a new student or enroll an existing student in a semester.
	 *
	 * Logic:
	 * 1. If student doesn't exist: Create user, student, and enrollment
	 * 2. If student exists but not enrolled in this semester: Use UserService.enrollExistingStudent
	 * 3. If student exists and already enrolled in this semester: Throw ConflictException
	 *
	 * Note: A student can be enrolled in multiple semesters simultaneously
	 */
	async create(dto: CreateStudentDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				// Validate major and semester
				await this.validateMajorForEnrollment(dto.majorId);
				await this.validateSemesterForEnrollment(dto.semesterId);

				const existingStudent = await prisma.student.findUnique({
					where: { studentId: dto.studentId },
					include: {
						user: {
							omit: {
								password: true,
							},
						},
						enrollments: {
							where: {
								semesterId: dto.semesterId,
							},
						},
					},
				});

				if (existingStudent) {
					// Check if student is already enrolled in this specific semester
					// Note: enrollments array is already filtered by semesterId above
					const isAlreadyEnrolledInThisSemester =
						existingStudent.enrollments.length > 0;

					if (isAlreadyEnrolledInThisSemester) {
						throw new ConflictException(
							`Student with studentId ${dto.studentId} is already enrolled in semester ${dto.semesterId}`,
						);
					}

					// Student exists but not enrolled in this semester
					// A student can be enrolled in multiple semesters, so we only enroll them in this semester
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { user: updatedUser, plainPassword } =
						await UserService.enrollExistingStudent(
							existingStudent.userId,
							dto.semesterId,
							prisma as PrismaClient,
							this.logger,
							dto.password,
						);

					this.logger.log(
						`Student ${dto.studentId} enrolled to semester ${dto.semesterId} with new password`,
					);

					return {
						...updatedUser,
						studentId: existingStudent.studentId,
						majorId: existingStudent.majorId,
					};
				}

				// Student doesn't exist, create new student
				const createUserDto: CreateUserDto = {
					email: dto.email,
					fullName: dto.fullName,
					password: dto.password,
					gender: dto.gender,
					phoneNumber: dto.phoneNumber,
				};

				// TODO: To send email to student with their credentials
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { plainPassword, ...newUser } = await UserService.create(
					createUserDto,
					prisma as PrismaClient,
					this.logger,
				);
				const userId = newUser.id;

				const student = await prisma.student.create({
					data: {
						userId: userId,
						studentId: dto.studentId,
						majorId: dto.majorId,
					},
				});

				await prisma.enrollment.create({
					data: {
						studentId: student.userId,
						semesterId: dto.semesterId,
						status: EnrollmentStatus.NotYet,
					},
				});

				this.logger.log(`Student created with studentId: ${dto.studentId}`);

				this.logger.log(
					`Student ${dto.studentId} enrolled to semester ${dto.semesterId}`,
				);

				return {
					...newUser,
					studentId: student.studentId,
					majorId: student.majorId,
				};
			});

			this.logger.log(`Student operation completed with userId: ${result.id}`);
			this.logger.debug('Student detail', result);

			return result;
		} catch (error) {
			this.logger.error('Error creating student', error);

			throw error;
		}
	}

	async findAll() {
		try {
			this.logger.log('Fetching all students');

			const students = await this.prisma.student.findMany({
				include: {
					user: {
						omit: {
							password: true,
						},
					},
				},
				orderBy: {
					user: {
						createdAt: 'desc',
					},
				},
			});

			// Reuse the same data transformation logic from findOne
			const formattedStudents = students.map((student) => ({
				...student.user,
				studentId: student.studentId,
				majorId: student.majorId,
			}));

			this.logger.log(`Found ${formattedStudents.length} students`);
			this.logger.debug('Students detail', formattedStudents);

			return formattedStudents;
		} catch (error) {
			this.logger.error('Error fetching students', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			this.logger.log(`Fetching student with ID: ${id}`);

			const student = await this.prisma.student.findUnique({
				where: { userId: id },
				include: {
					user: {
						omit: {
							password: true,
						},
					},
				},
			});

			if (!student) {
				this.logger.warn(`Student with ID ${id} not found`);

				throw new NotFoundException(`Student with ID ${id} not found`);
			}

			this.logger.log(`Student found with ID: ${id}`);
			this.logger.debug('Student detail', student);

			return {
				...student.user,
				studentId: student.studentId,
				majorId: student.majorId,
			};
		} catch (error) {
			this.logger.error(`Error fetching student with ID ${id}`, error);
			throw error;
		}
	}

	async update(id: string, dto: UpdateStudentDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const existingStudent = await prisma.student.findUnique({
					where: { userId: id },
				});

				if (!existingStudent) {
					this.logger.warn(`Student with ID ${id} not found for update`);

					throw new NotFoundException(`Student with ID ${id} not found`);
				}

				const updateUserDto: UpdateUserDto = {
					fullName: dto.fullName,
					gender: dto.gender,
					phoneNumber: dto.phoneNumber,
				};

				const updatedUser = await UserService.update(
					id,
					updateUserDto,
					prisma as PrismaClient,
					this.logger,
				);

				const updatedStudent = await prisma.student.findUnique({
					where: { userId: id },
				});

				return {
					...updatedUser,
					studentId: updatedStudent!.studentId,
					majorId: updatedStudent!.majorId,
				};
			});

			this.logger.log(`Student updated with ID: ${result.id}`);
			this.logger.debug('Updated Student', result);

			return result;
		} catch (error) {
			this.logger.error(`Error updating student with ID ${id}`, error);

			throw error;
		}
	}
	/**
	 * Create multiple students or enroll existing students in a semester (batch operation).
	 * Uses the same logic as the single create method for each student, including UserService.enrollExistingStudent.
	 *
	 * Note: A student can be enrolled in multiple semesters simultaneously
	 */
	async createMany(dto: ImportStudentDto) {
		try {
			// Validate semester and major before starting the import process
			await this.validateSemesterForEnrollment(dto.semesterId);
			await this.validateMajorForEnrollment(dto.majorId);

			const results = await this.prisma.$transaction(
				async (prisma) => {
					const createdStudents: any[] = [];

					for (const studentData of dto.students) {
						// Check if student already exists
						const existingStudent = await prisma.student.findUnique({
							where: { studentId: studentData.studentId },
							include: {
								user: {
									omit: {
										password: true,
									},
								},
								enrollments: {
									where: {
										semesterId: dto.semesterId,
									},
								},
							},
						});

						let result;

						if (existingStudent) {
							// Check if student is already enrolled in this specific semester
							// Note: enrollments array is already filtered by semesterId above
							const isAlreadyEnrolledInThisSemester =
								existingStudent.enrollments.length > 0;

							if (isAlreadyEnrolledInThisSemester) {
								throw new ConflictException(
									`Student with studentId ${studentData.studentId} is already enrolled in semester ${dto.semesterId}`,
								);
							}

							// Student exists but not enrolled in this semester
							// A student can be enrolled in multiple semesters, so we only enroll them in this semester
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							const { user: updatedUser, plainPassword } =
								await UserService.enrollExistingStudent(
									existingStudent.userId,
									dto.semesterId,
									prisma as PrismaClient,
									this.logger,
									studentData.password,
								);

							this.logger.log(
								`Student ${studentData.studentId} enrolled to semester ${dto.semesterId} with new password`,
							);

							result = {
								...updatedUser,
								studentId: existingStudent.studentId,
								majorId: existingStudent.majorId,
							};
						} else {
							// Student doesn't exist, create new student
							// Create user DTO
							const createUserDto: CreateUserDto = {
								email: studentData.email,
								fullName: studentData.fullName,
								password: studentData.password,
								gender: studentData.gender,
								phoneNumber: studentData.phoneNumber,
							};

							// Create user
							// TODO: To send email to student with their credentials
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							const { plainPassword, ...newUser } = await UserService.create(
								createUserDto,
								prisma as PrismaClient,
								this.logger,
							);
							const userId = newUser.id;

							// Create student
							const student = await prisma.student.create({
								data: {
									userId: userId,
									studentId: studentData.studentId,
									majorId: dto.majorId,
								},
							});

							await prisma.enrollment.create({
								data: {
									studentId: student.userId,
									semesterId: dto.semesterId,
									status: EnrollmentStatus.NotYet,
								},
							});

							this.logger.log(
								`Student ${studentData.studentId} created successfully`,
							);

							this.logger.log(
								`Student ${studentData.studentId} enrolled to semester ${dto.semesterId}`,
							);

							result = {
								...newUser,
								studentId: student.studentId,
								majorId: student.majorId,
							};
						}

						createdStudents.push(result);

						this.logger.log(
							`Student operation completed with userId: ${result.id}`,
						);
						this.logger.debug('Student detail', result);
					}

					return createdStudents;
				},
				{
					timeout: StudentService.TIMEOUT,
				},
			);

			this.logger.log(`Successfully processed ${results.length} students`);

			return results;
		} catch (error) {
			this.logger.error('Error creating students in batch', error);

			throw error;
		}
	}

	async toggleStatus(id: string, toggleDto: ToggleStudentStatusDto) {
		try {
			const { isActive } = toggleDto;

			const result = await this.prisma.$transaction(async (prisma) => {
				const existingStudent = await prisma.student.findUnique({
					where: { userId: id },
					include: {
						user: true,
					},
				});

				if (!existingStudent) {
					this.logger.warn(`Student with ID ${id} not found for status toggle`);

					throw new NotFoundException(`Student with ID ${id} not found`);
				}

				const updatedUser = await prisma.user.update({
					where: { id },
					data: {
						isActive: isActive,
					},
					omit: {
						password: true,
					},
				});

				return {
					...updatedUser,
					studentId: existingStudent.studentId,
					majorId: existingStudent.majorId,
				};
			});

			this.logger.log(
				`Student status updated - ID: ${id}, isActive: ${isActive}`,
			);

			this.logger.debug('Updated student status', result);

			return result;
		} catch (error) {
			this.logger.error(`Error toggling student status with ID ${id}`, error);

			throw error;
		}
	}
	async findAllBySemester(semesterId: string) {
		try {
			this.logger.log(`Fetching all students for semester: ${semesterId}`);

			// Validate semester exists (without status check)
			const semester = await this.prisma.semester.findUnique({
				where: { id: semesterId },
			});

			if (!semester) {
				throw new NotFoundException(`Semester with ID ${semesterId} not found`);
			}

			const enrollments = await this.prisma.enrollment.findMany({
				where: {
					semesterId: semesterId,
				},
				include: {
					student: {
						include: {
							user: {
								omit: {
									password: true,
								},
							},
						},
					},
				},
				orderBy: {
					student: {
						user: {
							createdAt: 'desc',
						},
					},
				},
			});

			// Format the response same as findAll - only basic student info
			const formattedStudents = enrollments.map((enrollment) => ({
				...enrollment.student.user,
				studentId: enrollment.student.studentId,
				majorId: enrollment.student.majorId,
			}));

			this.logger.log(
				`Found ${formattedStudents.length} students for semester ${semesterId}`,
			);
			this.logger.debug('Students detail', formattedStudents);

			return formattedStudents;
		} catch (error) {
			this.logger.error(
				`Error fetching students for semester ${semesterId}`,
				error,
			);

			throw error;
		}
	}
}
