import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { TIMEOUT } from '@/configs';
import { EmailJobDto } from '@/email/dto/email-job.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
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

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailQueueService,
	) {}

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
				const semester = await this.validateSemesterForEnrollment(
					dto.semesterId,
				);

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

				let user;
				let plainPassword: string;
				let studentInfo;
				let isNewStudent = false;

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
					const enrollResult = await UserService.enrollExistingStudent(
						existingStudent.userId,
						dto.semesterId,
						prisma as PrismaClient,
						this.logger,
					);

					user = enrollResult.user;
					plainPassword = enrollResult.plainPassword;
					studentInfo = {
						studentId: existingStudent.userId,
						majorId: existingStudent.majorId,
					};

					this.logger.log(
						`Student ${dto.studentId} enrolled to semester ${dto.semesterId} with new password`,
					);
				} else {
					// Student doesn't exist, create new student
					const createUserDto: CreateUserDto = {
						email: dto.email,
						fullName: dto.fullName,
						gender: dto.gender,
						phoneNumber: dto.phoneNumber,
					};

					const createResult = await UserService.create(
						createUserDto,
						prisma as PrismaClient,
						this.logger,
					);

					user = createResult;
					plainPassword = createResult.plainPassword;
					const userId = user.id;

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

					studentInfo = {
						studentId: student.studentId,
						majorId: student.majorId,
					};

					isNewStudent = true;

					this.logger.log(`Student created with studentId: ${dto.studentId}`);
					this.logger.log(
						`Student ${dto.studentId} enrolled to semester ${dto.semesterId}`,
					);
				}

				// Send welcome email with credentials (unified logic)
				const emailDto: EmailJobDto = {
					to: user.email,
					subject: isNewStudent
						? 'Welcome to TheSync'
						: 'Welcome back to TheSync',
					context: {
						fullName: user.fullName,
						email: user.email,
						password: plainPassword,
						studentId: studentInfo.studentId,
						semesterName: semester.name,
					},
				};
				await this.email.sendEmail(
					EmailJobType.SEND_STUDENT_ACCOUNT,
					emailDto,
					500,
				);

				return {
					...user,
					...studentInfo,
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
			const semester = await this.validateSemesterForEnrollment(dto.semesterId);
			await this.validateMajorForEnrollment(dto.majorId);

			const results = await this.prisma.$transaction(
				async (prisma) => {
					const createdStudents: any[] = [];
					const emailsToSend: EmailJobDto[] = [];

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
						let shouldSendEmail = false;
						let passwordForEmail = '';
						let isNewStudent = false;

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
							const { user: updatedUser, plainPassword } =
								await UserService.enrollExistingStudent(
									existingStudent.userId,
									dto.semesterId,
									prisma as PrismaClient,
									this.logger,
								);

							this.logger.log(
								`Student ${studentData.studentId} enrolled to semester ${dto.semesterId} with new password`,
							);

							result = {
								...updatedUser,
								studentId: existingStudent.userId,
								majorId: existingStudent.majorId,
							};

							// Send email for re-enrolled student with new password
							shouldSendEmail = true;
							passwordForEmail = plainPassword;
						} else {
							// Student doesn't exist, create new student
							// Create user DTO
							const createUserDto: CreateUserDto = {
								email: studentData.email,
								fullName: studentData.fullName,
								gender: studentData.gender,
								phoneNumber: studentData.phoneNumber,
							};

							// Create user
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

							// Send email for new student
							shouldSendEmail = true;
							passwordForEmail = plainPassword;
							isNewStudent = true;
						}

						// Prepare email data for bulk sending
						if (shouldSendEmail) {
							const emailDto: EmailJobDto = {
								to: result.email,
								subject: isNewStudent
									? 'Welcome to TheSync'
									: 'Welcome back to TheSync',
								context: {
									fullName: result.fullName,
									email: result.email,
									password: passwordForEmail,
									studentId: result.studentId,
									semesterName: semester.name,
								},
							};
							emailsToSend.push(emailDto);
						}

						createdStudents.push(result);

						this.logger.log(
							`Student operation completed with userId: ${result.id}`,
						);
						this.logger.debug('Student detail', result);
					}

					// Send bulk emails after all students are created successfully
					if (emailsToSend.length > 0) {
						await this.email.sendBulkEmails(
							EmailJobType.SEND_STUDENT_ACCOUNT,
							emailsToSend,
							500,
						);
					}

					return createdStudents;
				},
				{
					timeout: TIMEOUT,
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
					studentId: existingStudent.userId,
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

	private async validateStudentDeletion(
		studentUserId: string,
		prisma: any,
	): Promise<void> {
		const [enrollmentExists, studentGroupParticipationExists] =
			await Promise.all([
				prisma.enrollment.find({
					where: {
						studentId: studentUserId,
						status: {
							not: EnrollmentStatus.NotYet,
						},
					},
					select: { studentId: true, semesterId: true, status: true },
				}),

				prisma.studentGroupParticipation.findFirst({
					where: { studentId: studentUserId },
					select: { studentId: true, groupId: true },
				}),
			]);

		const constraints = [
			{
				condition: enrollmentExists,
				message: `Student has enrollments with status ${enrollmentExists.status}`,
				logMessage: `has enrollments with status ${enrollmentExists?.status || 'unknown'} (only NotYet status allowed for deletion)`,
			},
			{
				condition: studentGroupParticipationExists,
				message: 'Student is participating in groups',
				logMessage: 'is participating in groups',
			},
		];

		for (const constraint of constraints) {
			if (constraint.condition) {
				this.logger.warn(
					`Student with ID ${studentUserId} ${constraint.logMessage}`,
				);
				throw new BadRequestException(
					`Cannot delete student with ID ${studentUserId}. ${constraint.message}`,
				);
			}
		}
	}

	async delete(id: string) {
		try {
			this.logger.log(`Deleting student with ID: ${id}`);

			const result = await this.prisma.$transaction(async (prisma) => {
				const existingStudent = await prisma.student.findUnique({
					where: { userId: id },
					include: { user: true },
				});

				if (!existingStudent) {
					this.logger.warn(`Student with ID ${id} not found for deletion`);
					throw new NotFoundException(`Student with ID ${id} not found`);
				}

				await this.validateStudentDeletion(existingStudent.userId, prisma);

				const studentToDelete = {
					...existingStudent.user,
					studentId: existingStudent.userId,
					majorId: existingStudent.majorId,
				};

				await Promise.all([
					prisma.studentSkill.deleteMany({
						where: { studentId: existingStudent.userId },
					}),
					prisma.studentExpectedResponsibility.deleteMany({
						where: { studentId: existingStudent.userId },
					}),
					prisma.request.deleteMany({
						where: { studentId: existingStudent.userId },
					}),
					prisma.enrollment.deleteMany({
						where: { studentId: existingStudent.userId },
					}),
				]);

				await prisma.student.delete({ where: { userId: id } });
				await prisma.user.delete({ where: { id } });

				this.logger.log(`Student successfully deleted with ID: ${id}`);
				this.logger.debug('Deleted student details:', {
					id: studentToDelete.id,
					email: studentToDelete.email,
					fullName: studentToDelete.fullName,
					studentId: studentToDelete.studentId,
					majorId: studentToDelete.majorId,
				});

				return studentToDelete;
			});

			return result;
		} catch (error) {
			this.logger.error(`Error deleting student with ID ${id}:`, error.message);
			throw error;
		}
	}
}
