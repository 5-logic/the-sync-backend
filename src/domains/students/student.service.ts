import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateStudentDto } from '@/students/dto/create-student.dto';
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
				`Cannot add students to semester ${semesterId}. Semester status is ${semester.status}. Only Preparing and Picking semesters allow student enrollment.`,
			);
		}

		return semester;
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
	async create(createStudentDto: CreateStudentDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const major = await prisma.major.findUnique({
					where: { id: createStudentDto.majorId },
				});

				if (!major) {
					throw new NotFoundException(
						`Major with ID ${createStudentDto.majorId} not found`,
					);
				}

				// Validate semester exists and has correct status for enrollment
				await this.validateSemesterForEnrollment(createStudentDto.semesterId);

				const existingStudent = await prisma.student.findUnique({
					where: { studentId: createStudentDto.studentId },
					include: {
						user: {
							omit: {
								password: true,
							},
						},
						enrollments: {
							where: {
								semesterId: createStudentDto.semesterId,
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
							`Student with studentId ${createStudentDto.studentId} is already enrolled in semester ${createStudentDto.semesterId}`,
						);
					}

					// Student exists but not enrolled in this semester
					// A student can be enrolled in multiple semesters, so we only enroll them in this semester
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { user: updatedUser, plainPassword } =
						await UserService.enrollExistingStudent(
							existingStudent.userId,
							createStudentDto.semesterId,
							prisma as PrismaClient,
							this.logger,
							createStudentDto.password,
						);

					this.logger.log(
						`Student ${createStudentDto.studentId} enrolled to semester ${createStudentDto.semesterId} with new password`,
					);

					return {
						...updatedUser,
						studentId: existingStudent.studentId,
						majorId: existingStudent.majorId,
					};
				}

				// Student doesn't exist, create new student
				const createUserDto: CreateUserDto = {
					email: createStudentDto.email,
					fullName: createStudentDto.fullName,
					password: createStudentDto.password,
					gender: createStudentDto.gender,
					phoneNumber: createStudentDto.phoneNumber,
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
						studentId: createStudentDto.studentId,
						majorId: createStudentDto.majorId,
					},
				});

				await prisma.enrollment.create({
					data: {
						studentId: student.userId,
						semesterId: createStudentDto.semesterId,
						status: EnrollmentStatus.NotYet,
					},
				});

				this.logger.log(
					`Student created with studentId: ${createStudentDto.studentId}`,
				);

				this.logger.log(
					`Student ${createStudentDto.studentId} enrolled to semester ${createStudentDto.semesterId}`,
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

	async update(id: string, updateStudentDto: UpdateStudentDto) {
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
					fullName: updateStudentDto.fullName,
					gender: updateStudentDto.gender,
					phoneNumber: updateStudentDto.phoneNumber,
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
	async createMany(createStudentDtos: CreateStudentDto[]) {
		try {
			const results = await this.prisma.$transaction(async (prisma) => {
				const createdStudents: any[] = [];

				for (const createStudentDto of createStudentDtos) {
					// Validate major exists
					const major = await prisma.major.findUnique({
						where: { id: createStudentDto.majorId },
					});

					if (!major) {
						throw new NotFoundException(
							`Major with ID ${createStudentDto.majorId} not found`,
						);
					}

					// Validate semester exists and has correct status for enrollment
					await this.validateSemesterForEnrollment(createStudentDto.semesterId);

					// Check if student already exists
					const existingStudent = await prisma.student.findUnique({
						where: { studentId: createStudentDto.studentId },
						include: {
							user: {
								omit: {
									password: true,
								},
							},
							enrollments: {
								where: {
									semesterId: createStudentDto.semesterId,
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
								`Student with studentId ${createStudentDto.studentId} is already enrolled in semester ${createStudentDto.semesterId}`,
							);
						}

						// Student exists but not enrolled in this semester
						// A student can be enrolled in multiple semesters, so we only enroll them in this semester
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { user: updatedUser, plainPassword } =
							await UserService.enrollExistingStudent(
								existingStudent.userId,
								createStudentDto.semesterId,
								prisma as PrismaClient,
								this.logger,
								createStudentDto.password,
							);

						this.logger.log(
							`Student ${createStudentDto.studentId} enrolled to semester ${createStudentDto.semesterId} with new password`,
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
							email: createStudentDto.email,
							fullName: createStudentDto.fullName,
							password: createStudentDto.password,
							gender: createStudentDto.gender,
							phoneNumber: createStudentDto.phoneNumber,
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
								studentId: createStudentDto.studentId,
								majorId: createStudentDto.majorId,
							},
						});

						await prisma.enrollment.create({
							data: {
								studentId: student.userId,
								semesterId: createStudentDto.semesterId,
								status: EnrollmentStatus.NotYet,
							},
						});

						this.logger.log(
							`Student ${createStudentDto.studentId} created successfully`,
						);

						this.logger.log(
							`Student ${createStudentDto.studentId} enrolled to semester ${createStudentDto.semesterId}`,
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
			});

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
}
