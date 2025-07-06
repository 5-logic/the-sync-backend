import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CONSTANTS } from '@/configs';
import { EmailJobDto } from '@/email/dto/email-job.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import {
	CreateStudentDto,
	ImportStudentDto,
	SelfUpdateStudentDto,
	ToggleStudentStatusDto,
	UpdateStudentDto,
} from '@/students/dto';
import { generateStrongPassword, hash } from '@/utils';

import { SemesterStatus } from '~/generated/prisma';

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
			throw new NotFoundException(`Semester not found`);
		}

		// Only allow enrollment when semester is in Preparing status
		if (semester.status !== SemesterStatus.Preparing) {
			throw new ConflictException(
				`Cannot add students to semester ${semester.name}. Semester status is ${semester.status}. Only ${SemesterStatus.Preparing} semesters allow student enrollment.`,
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
			throw new NotFoundException(`Major not found`);
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
		this.logger.log(
			`Creating student with studentCode: ${dto.studentCode}, email: ${dto.email}`,
		);

		try {
			// Validate major and semester
			await this.validateMajorForEnrollment(dto.majorId);
			const semester = await this.validateSemesterForEnrollment(dto.semesterId);

			let emailDto: EmailJobDto | undefined = undefined;
			let isNewStudent = false;

			const plainPassword = generateStrongPassword();
			const hashedPassword = await hash(plainPassword);

			const result = await this.prisma.$transaction(async (txn) => {
				const existingStudent = await txn.student.findUnique({
					where: { studentCode: dto.studentCode },
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

				let userInfo;
				let studentInfo;

				if (existingStudent) {
					// Check if student is already enrolled in this specific semester
					// Note: enrollments array is already filtered by semesterId above
					const isAlreadyEnrolledInThisSemester =
						existingStudent.enrollments.length > 0;

					if (isAlreadyEnrolledInThisSemester) {
						throw new ConflictException(
							`Student with studentCode ${dto.studentCode} is already enrolled in semester ${semester.name}}`,
						);
					}

					// Student exists but not enrolled in this semester
					// A student can be enrolled in multiple semesters, so we only enroll them in this semester
					userInfo = await txn.user.update({
						where: { id: existingStudent.userId },
						data: {
							password: hashedPassword,
						},
						omit: {
							password: true,
						},
					});

					await txn.enrollment.create({
						data: {
							studentId: existingStudent.userId,
							semesterId: dto.semesterId,
						},
					});

					studentInfo = {
						studentCode: existingStudent.studentCode,
						majorId: existingStudent.majorId,
					};

					this.logger.log(
						`Student ${dto.studentCode} enrolled to semester ${dto.semesterId} with new password`,
					);
				} else {
					// Student doesn't exist, create new student
					userInfo = await txn.user.create({
						data: {
							email: dto.email,
							fullName: dto.fullName,
							gender: dto.gender,
							phoneNumber: dto.phoneNumber,
							password: hashedPassword,
						},
						omit: {
							password: true,
						},
					});

					studentInfo = await txn.student.create({
						data: {
							userId: userInfo.id,
							studentCode: dto.studentCode,
							majorId: dto.majorId,
						},
						select: {
							studentCode: true,
							majorId: true,
						},
					});

					await txn.enrollment.create({
						data: {
							studentId: userInfo.id,
							semesterId: dto.semesterId,
						},
					});

					isNewStudent = true;

					this.logger.log(
						`Student created with studentCode: ${dto.studentCode}`,
					);
					this.logger.log(
						`Student ${dto.studentCode} enrolled to semester ${dto.semesterId}`,
					);
				}

				// Prepare email data
				emailDto = {
					to: userInfo.email,
					subject: isNewStudent
						? 'Welcome to TheSync'
						: 'Welcome back to TheSync',
					context: {
						fullName: userInfo.fullName,
						email: userInfo.email,
						password: plainPassword,
						studentCode: studentInfo.studentCode,
						semesterName: semester.name,
					},
				};

				return {
					...userInfo,
					...studentInfo,
				};
			});

			// Send email after all operations are successful
			if (!emailDto) {
				this.logger.warn(
					'No email data prepared for sending after student creation',
				);

				throw Error(
					'No email data prepared for sending after student creation',
				);
			}

			await this.email.sendEmail(
				EmailJobType.SEND_STUDENT_ACCOUNT,
				emailDto,
				500,
			);

			this.logger.log(`Student operation completed with userId: ${result.id}`);
			this.logger.debug('Student detail', result);

			return result;
		} catch (error) {
			this.logger.error('Error creating student', error);

			throw error;
		}
	}

	async findAll() {
		this.logger.log('Fetching all students');

		try {
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
				studentCode: student.studentCode,
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
		this.logger.log(`Fetching student with ID: ${id}`);

		try {
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

				throw new NotFoundException(`Student not found`);
			}

			this.logger.log(`Student found with ID: ${id}`);
			this.logger.debug('Student detail', student);

			return {
				...student.user,
				studentCode: student.studentCode,
				majorId: student.majorId,
			};
		} catch (error) {
			this.logger.error(`Error fetching student with ID ${id}`, error);
			throw error;
		}
	}

	async update(id: string, dto: SelfUpdateStudentDto) {
		this.logger.log(`Updating student with ID: ${id}`);

		try {
			const result = await this.prisma.$transaction(async (txn) => {
				const existingStudent = await txn.student.findUnique({
					where: { userId: id },
				});

				if (!existingStudent) {
					this.logger.warn(`Student with ID ${id} not found for update`);

					throw new NotFoundException(`Student not found`);
				}

				const updatedUser = await txn.user.update({
					where: { id },
					data: {
						fullName: dto.fullName,
						gender: dto.gender,
						phoneNumber: dto.phoneNumber,
					},
					omit: {
						password: true,
					},
				});

				return {
					...updatedUser,
					studentCode: existingStudent.studentCode,
					majorId: existingStudent.majorId,
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

	async updateByAdmin(id: string, dto: UpdateStudentDto) {
		this.logger.log(`Updating student by admin with ID: ${id}`);

		try {
			const result = await this.prisma.$transaction(async (txn) => {
				const existingStudent = await txn.user.findUnique({
					where: { id: id },
				});

				if (!existingStudent) {
					this.logger.warn(`Student with ID ${id} not found for update`);

					throw new NotFoundException(`Student not found`);
				}

				const updatedUser = await txn.user.update({
					where: { id: id },
					data: {
						email: dto.email,
						fullName: dto.fullName,
						gender: dto.gender,
						phoneNumber: dto.phoneNumber,
					},
				});

				const updatedStudent = await txn.student.update({
					where: { userId: id },
					data: {
						studentCode: dto.studentCode,
						majorId: dto.majorId,
					},
				});

				return {
					...updatedUser,
					studentCode: updatedStudent.studentCode,
					majorId: updatedStudent.majorId,
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
		this.logger.log(
			`Creating students in batch for semesterId: ${dto.semesterId}, majorId: ${dto.majorId}`,
		);

		try {
			// Validate semester and major before starting the import process
			const semester = await this.validateSemesterForEnrollment(dto.semesterId);
			await this.validateMajorForEnrollment(dto.majorId);

			const emailsToSend: EmailJobDto[] = [];

			const results = await this.prisma.$transaction(
				async (txn) => {
					const createdStudents: any[] = [];

					for (const studentData of dto.students) {
						// Check if student already exists
						const existingStudent = await txn.student.findUnique({
							where: { studentCode: studentData.studentCode },
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
						const plainPassword = generateStrongPassword();
						const hashedPassword = await hash(plainPassword);
						let isNewStudent = false;

						if (existingStudent) {
							// Check if student is already enrolled in this specific semester
							// Note: enrollments array is already filtered by semesterId above
							const isAlreadyEnrolledInThisSemester =
								existingStudent.enrollments.length > 0;

							if (isAlreadyEnrolledInThisSemester) {
								throw new ConflictException(
									`Student with studentCode ${studentData.studentCode} is already enrolled in semester ${semester.name}}`,
								);
							}

							// Student exists but not enrolled in this semester
							// A student can be enrolled in multiple semesters, so we only enroll them in this semester
							const updatedUser = await txn.user.update({
								where: { id: existingStudent.userId },
								data: {
									password: hashedPassword,
								},
								omit: {
									password: true,
								},
							});

							// Enroll the existing student in the new semester
							await txn.enrollment.create({
								data: {
									studentId: existingStudent.userId,
									semesterId: dto.semesterId,
								},
							});

							this.logger.log(
								`Student ${studentData.studentCode} enrolled to semester ${dto.semesterId} with new password`,
							);

							result = {
								...updatedUser,
								studentCode: existingStudent.studentCode,
								majorId: existingStudent.majorId,
							};
						} else {
							// Student doesn't exist, create new student
							const newUser = await txn.user.create({
								data: {
									email: studentData.email,
									fullName: studentData.fullName,
									gender: studentData.gender,
									phoneNumber: studentData.phoneNumber,
									password: hashedPassword,
								},
								omit: {
									password: true,
								},
							});

							// Create student
							const newStudent = await txn.student.create({
								data: {
									userId: newUser.id,
									studentCode: studentData.studentCode,
									majorId: dto.majorId,
								},
							});

							// Create enrollment for the new student
							await txn.enrollment.create({
								data: {
									studentId: newStudent.userId,
									semesterId: dto.semesterId,
								},
							});

							this.logger.log(
								`Student ${studentData.studentCode} created successfully`,
							);

							this.logger.log(
								`Student ${studentData.studentCode} enrolled to semester ${dto.semesterId}`,
							);

							result = {
								...newUser,
								studentCode: newStudent.studentCode,
								majorId: newStudent.majorId,
							};

							isNewStudent = true;
						}

						// Prepare email data for bulk sending
						const emailDto: EmailJobDto = {
							to: result.email,
							subject: isNewStudent
								? 'Welcome to TheSync'
								: 'Welcome back to TheSync',
							context: {
								fullName: result.fullName,
								email: result.email,
								password: plainPassword,
								studentCode: result.studentCode,
								semesterName: semester.name,
							},
						};
						emailsToSend.push(emailDto);

						createdStudents.push(result);

						this.logger.log(
							`Student operation completed with userId: ${result.id}`,
						);
						this.logger.debug('Student detail', result);
					}

					return createdStudents;
				},
				{
					timeout: CONSTANTS.TIMEOUT,
				},
			);

			// Send bulk emails after all students are created successfully
			if (emailsToSend.length > 0) {
				await this.email.sendBulkEmails(
					EmailJobType.SEND_STUDENT_ACCOUNT,
					emailsToSend,
					500,
				);
			}

			this.logger.log(`Successfully processed ${results.length} students`);

			return results;
		} catch (error) {
			this.logger.error('Error creating students in batch', error);

			throw error;
		}
	}

	async toggleStatus(id: string, toggleDto: ToggleStudentStatusDto) {
		this.logger.log(
			`Toggling status for student with ID: ${id}, isActive: ${toggleDto.isActive}`,
		);

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

					throw new NotFoundException(`Student not found`);
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
					studentCode: existingStudent.studentCode,
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
		this.logger.log(`Fetching all students for semester: ${semesterId}`);

		try {
			// Validate semester exists (without status check)
			const semester = await this.prisma.semester.findUnique({
				where: { id: semesterId },
			});

			if (!semester) {
				throw new NotFoundException(`Semester not found`);
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
				studentCode: enrollment.student.studentCode,
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

	async findStudentsWithoutGroup(semesterId: string) {
		this.logger.log(
			`Fetching students without group for semester: ${semesterId}`,
		);

		try {
			// Validate semester exists
			const semester = await this.prisma.semester.findUnique({
				where: { id: semesterId },
			});

			if (!semester) {
				throw new NotFoundException(`Semester not found`);
			}

			// Find all students enrolled in the semester who don't have a group participation
			const studentsWithoutGroup = await this.prisma.student.findMany({
				where: {
					enrollments: {
						some: {
							semesterId: semesterId,
						},
					},
					studentGroupParticipations: {
						none: {
							semesterId: semesterId,
						},
					},
				},
				include: {
					user: {
						omit: {
							password: true,
						},
					},
					major: {
						select: {
							id: true,
							name: true,
							code: true,
						},
					},
				},
				orderBy: {
					user: {
						createdAt: 'desc',
					},
				},
			});

			// Format the response same as other methods
			const formattedStudents = studentsWithoutGroup.map((student) => ({
				...student.user,
				studentCode: student.studentCode,
				major: student.major,
			}));

			this.logger.log(
				`Found ${formattedStudents.length} students without group for semester ${semesterId}`,
			);
			this.logger.debug('Students without group detail', formattedStudents);

			return formattedStudents;
		} catch (error) {
			this.logger.error(
				`Error fetching students without group for semester ${semesterId}`,
				error,
			);

			throw error;
		}
	}

	async delete(id: string, semesterId: string) {
		this.logger.log(
			`Deleting student with ID: ${id} in Semester ${semesterId}`,
		);

		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				// Single query to get all required data
				const [existingStudent, existingSemester] = await Promise.all([
					prisma.student.findUnique({
						where: { userId: id },
						include: {
							user: {
								omit: {
									password: true,
								},
							},
							enrollments: {
								select: {
									semesterId: true,
								},
							},
						},
					}),
					prisma.semester.findUnique({
						where: { id: semesterId },
						select: { id: true, name: true, status: true },
					}),
				]);

				if (!existingStudent) {
					this.logger.warn(`Student with ID ${id} not found for deletion`);

					throw new NotFoundException(`Student not found`);
				}

				if (!existingSemester) {
					this.logger.warn(
						`Semester with ID ${semesterId} not found for deletion`,
					);

					throw new NotFoundException(`Semester not found`);
				}

				if (existingSemester.status !== SemesterStatus.Preparing) {
					this.logger.warn(
						`Cannot delete student in semester ${semesterId} with status ${existingSemester.status}`,
					);

					throw new ConflictException(
						`Cannot delete student in semester ${existingSemester.name}. Only ${SemesterStatus.Preparing} semesters allow student deletion.`,
					);
				}

				// Check if enrollment exists in the specified semester
				const enrollmentInSemester = existingStudent.enrollments.some(
					(enrollment) => enrollment.semesterId === semesterId,
				);

				if (!enrollmentInSemester) {
					this.logger.warn(
						`Student with ID ${id} is not enrolled in semester ${semesterId}`,
					);

					throw new NotFoundException(
						`Student is not enrolled in semester ${existingSemester.name}`,
					);
				}

				// If the student is enrolled in multiple semesters, only delete the enrollment for the specified semester.
				// Otherwise, delete the student and associated user completely.
				if (existingStudent.enrollments.length >= 2) {
					await prisma.enrollment.delete({
						where: {
							studentId_semesterId: {
								studentId: id,
								semesterId: semesterId,
							},
						},
					});
				} else {
					await prisma.student.delete({
						where: { userId: existingStudent.userId },
					});

					await prisma.user.delete({
						where: { id: existingStudent.userId },
					});
				}

				return {
					...existingStudent.user,
					studentCode: existingStudent.studentCode,
					majorId: existingStudent.majorId,
				};
			});

			return result;
		} catch (error) {
			this.logger.error(`Error deleting student with ID ${id}:`, error);

			throw error;
		}
	}
}
