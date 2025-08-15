import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CONSTANTS } from '@/configs';
import {
	// CacheHelperService,
	PrismaService,
} from '@/providers';
import { EmailJobDto, EmailJobType, EmailQueueService } from '@/queue';
// import { CACHE_KEY } from '@/students/constants';
import {
	CreateStudentDto,
	ImportStudentDto,
	ToggleStudentStatusDto,
	UpdateStudentDto,
} from '@/students/dtos';
import { mapStudentV1, mapStudentV2 } from '@/students/mappers';
import { StudentResponse } from '@/students/responses';
import { generateStrongPassword, hash } from '@/utils';

import { Semester, SemesterStatus, Student, User } from '~/generated/prisma';

@Injectable()
export class StudentAdminService {
	private readonly logger = new Logger(StudentAdminService.name);

	constructor(
		// private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
		private readonly email: EmailQueueService,
	) {}

	async create(dto: CreateStudentDto): Promise<StudentResponse> {
		this.logger.log(
			`Creating student with studentCode: ${dto.studentCode}, email: ${dto.email}`,
		);

		try {
			// Validate major and semester
			const emailExists = await this.prisma.user.findUnique({
				where: { email: dto.email },
			});

			if (emailExists) {
				throw new ConflictException(
					`Email ${dto.email} already exists in the system.`,
				);
			}

			await this.validateMajorForEnrollment(dto.majorId);
			const semester = await this.validateSemesterForEnrollment(dto.semesterId);

			// Validate duplicate studentCode or email in system before create
			const [existingStudentCode, existingUserEmail] = await Promise.all([
				this.prisma.student.findUnique({
					where: { studentCode: dto.studentCode },
				}),
				this.prisma.user.findUnique({
					where: { email: dto.email },
				}),
			]);
			if (existingStudentCode) {
				throw new ConflictException(
					`StudentCode ${dto.studentCode} already exists in the system.`,
				);
			}
			if (existingUserEmail) {
				throw new ConflictException(
					`Email ${dto.email} already exists in the system.`,
				);
			}

			let emailDto: EmailJobDto | undefined = undefined;
			let isNewStudent = false;

			const plainPassword = generateStrongPassword();
			const hashedPassword = await hash(plainPassword);

			const result = await this.prisma.$transaction(
				async (txn) => {
					const existingStudent = await txn.student.findUnique({
						where: { studentCode: dto.studentCode },
						include: {
							user: true,
							enrollments: {
								where: {
									semesterId: dto.semesterId,
								},
							},
						},
					});

					let userInfo: User;
					let studentInfo: Student;

					if (existingStudent) {
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
						});

						await txn.enrollment.create({
							data: {
								studentId: existingStudent.userId,
								semesterId: dto.semesterId,
							},
						});

						studentInfo = existingStudent;

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
						});

						studentInfo = await txn.student.create({
							data: {
								userId: userInfo.id,
								studentCode: dto.studentCode,
								majorId: dto.majorId,
							},
						});

						await txn.enrollment.create({
							data: {
								studentId: userInfo.id,
								semesterId: dto.semesterId,
							},
						});

						// Get all responsibilities and create associations with default level 0
						const allResponsibilities = await txn.responsibility.findMany({
							select: { id: true },
						});

						if (allResponsibilities.length > 0) {
							await txn.studentResponsibility.createMany({
								data: allResponsibilities.map((responsibility) => ({
									studentId: userInfo.id,
									responsibilityId: responsibility.id,
								})),
							});

							this.logger.log(
								`Created ${allResponsibilities.length} responsibility associations for student ${dto.studentCode}`,
							);
						}

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

					const result: StudentResponse = mapStudentV1(userInfo, studentInfo);

					return result;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

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
			this.logger.debug('Student detail', JSON.stringify(result));

			// await this.cache.delete(`${CACHE_KEY}/`);

			return result;
		} catch (error) {
			this.logger.error('Error creating student', error);

			throw error;
		}
	}

	async createMany(dto: ImportStudentDto): Promise<StudentResponse[]> {
		this.logger.log(
			`Creating students in batch for semesterId: ${dto.semesterId}, majorId: ${dto.majorId}`,
		);

		try {
			// Validate semester and major before starting the import process
			const semester = await this.validateSemesterForEnrollment(dto.semesterId);
			await this.validateMajorForEnrollment(dto.majorId);

			// Validate duplicate studentCode or email in system before import
			const studentCodes = dto.students.map((s) => s.studentCode);
			const emails = dto.students.map((s) => s.email);

			const [existingStudents, existingUsers] = await Promise.all([
				this.prisma.student.findMany({
					where: { studentCode: { in: studentCodes } },
					select: { studentCode: true },
				}),
				this.prisma.user.findMany({
					where: { email: { in: emails } },
					select: { email: true },
				}),
			]);

			if (existingStudents.length > 0) {
				const codes = existingStudents.map((s) => s.studentCode).join(', ');
				throw new ConflictException(
					`The following studentCodes already exist: ${codes}`,
				);
			}
			if (existingUsers.length > 0) {
				const existEmails = existingUsers.map((u) => u.email).join(', ');
				throw new ConflictException(
					`The following emails already exist: ${existEmails}`,
				);
			}

			const emailsToSend: EmailJobDto[] = [];

			const results = await this.prisma.$transaction(
				async (txn) => {
					const createdStudents: StudentResponse[] = [];

					// Get all responsibilities once for efficiency
					const allResponsibilities = await txn.responsibility.findMany({
						select: { id: true },
					});

					for (const studentData of dto.students) {
						// Check if student already exists
						const existingStudent = await txn.student.findUnique({
							where: { studentCode: studentData.studentCode },
							include: {
								user: true,
								enrollments: {
									where: {
										semesterId: dto.semesterId,
									},
								},
							},
						});

						let result: StudentResponse;
						const plainPassword = generateStrongPassword();
						const hashedPassword = await hash(plainPassword);
						let isNewStudent = false;

						if (existingStudent) {
							const isAlreadyEnrolledInThisSemester =
								existingStudent.enrollments.length > 0;

							if (isAlreadyEnrolledInThisSemester) {
								throw new ConflictException(
									`Student with studentCode ${studentData.studentCode} is already enrolled in semester ${semester.name}}`,
								);
							}

							const updatedUser = await txn.user.update({
								where: { id: existingStudent.userId },
								data: {
									password: hashedPassword,
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

							result = mapStudentV1(updatedUser, existingStudent);
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

							// Create associations with all responsibilities with default level 0
							if (allResponsibilities.length > 0) {
								await txn.studentResponsibility.createMany({
									data: allResponsibilities.map((responsibility) => ({
										studentId: newUser.id,
										responsibilityId: responsibility.id,
									})),
								});

								this.logger.log(
									`Created ${allResponsibilities.length} responsibility associations for student ${studentData.studentCode}`,
								);
							}

							this.logger.log(
								`Student ${studentData.studentCode} created successfully`,
							);
							this.logger.log(
								`Student ${studentData.studentCode} enrolled to semester ${dto.semesterId}`,
							);

							result = mapStudentV1(newUser, newStudent);

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
						this.logger.debug('Student detail', JSON.stringify(result));
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

			// await this.cache.delete(`${CACHE_KEY}/`);

			return results;
		} catch (error) {
			this.logger.error('Error creating students in batch', error);

			throw error;
		}
	}

	async updateByAdmin(
		id: string,
		dto: UpdateStudentDto,
	): Promise<StudentResponse> {
		this.logger.log(`Updating student by admin with ID: ${id}`);

		try {
			// Only check for email conflict if dto.email is provided
			if (dto.email) {
				const emailExists = await this.prisma.user.findUnique({
					where: { email: dto.email },
				});
				if (emailExists && emailExists.id !== id) {
					throw new ConflictException(
						`Email ${dto.email} already exists in the system.`,
					);
				}
			}

			// Only check for studentCode conflict if dto.studentCode is provided
			if (dto.studentCode) {
				const studentCodeExists = await this.prisma.student.findUnique({
					where: { studentCode: dto.studentCode },
				});
				if (studentCodeExists && studentCodeExists.userId !== id) {
					throw new ConflictException(
						`StudentCode ${dto.studentCode} already exists in the system.`,
					);
				}
			}

			const result = await this.prisma.$transaction(
				async (txn) => {
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

					const result: StudentResponse = mapStudentV1(
						updatedUser,
						updatedStudent,
					);

					return result;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(`Student updated with ID: ${result.id}`);
			this.logger.debug('Updated Student', JSON.stringify(result));

			// await this.cache.delete(`${CACHE_KEY}/${id}`);

			return result;
		} catch (error) {
			this.logger.error(`Error updating student with ID ${id}`, error);

			throw error;
		}
	}

	async toggleStatus(
		id: string,
		dto: ToggleStudentStatusDto,
	): Promise<StudentResponse> {
		this.logger.log(
			`Toggling status for student with ID: ${id}, isActive: ${dto.isActive}`,
		);

		try {
			const result = await this.prisma.$transaction(
				async (prisma) => {
					const existingStudent = await prisma.student.findUnique({
						where: { userId: id },
					});

					if (!existingStudent) {
						this.logger.warn(
							`Student with ID ${id} not found for status toggle`,
						);

						throw new NotFoundException(`Student not found`);
					}

					const updatedUser = await prisma.user.update({
						where: { id },
						data: {
							isActive: dto.isActive,
						},
					});

					const result: StudentResponse = mapStudentV1(
						updatedUser,
						existingStudent,
					);

					return result;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(
				`Student status updated - ID: ${id}, isActive: ${dto.isActive}`,
			);
			this.logger.debug('Updated student status', JSON.stringify(result));

			// await this.cache.delete(`${CACHE_KEY}/${id}`);

			return result;
		} catch (error) {
			this.logger.error(`Error toggling student status with ID ${id}`, error);

			throw error;
		}
	}

	async delete(id: string, semesterId: string): Promise<StudentResponse> {
		this.logger.log(
			`Deleting student with ID: ${id} in Semester ${semesterId}`,
		);

		try {
			const result = await this.prisma.$transaction(
				async (prisma) => {
					// Single query to get all required data
					const [existingStudent, existingSemester] = await Promise.all([
						prisma.student.findUnique({
							where: { userId: id },
							include: {
								user: true,
								enrollments: true,
							},
						}),
						prisma.semester.findUnique({
							where: { id: semesterId },
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

					// Validate: Nếu student đã có group trong semester này thì không cho xóa
					const groupParticipation =
						await prisma.studentGroupParticipation.findFirst({
							where: {
								studentId: id,
								semesterId: semesterId,
							},
						});
					if (groupParticipation) {
						this.logger.warn(
							`Cannot delete student with ID ${id} in semester ${semesterId} because student has already joined a group`,
						);
						throw new ConflictException(
							`Cannot delete student in semester ${existingSemester.name} because this student has already joined a group.`,
						);
					}

					// If the student is enrolled in multiple semesters, only delete the enrollment for the specified semester.
					// Otherwise, delete the student and associated user completely.
					if (existingStudent.enrollments.length > 1) {
						await prisma.enrollment.delete({
							where: {
								studentId_semesterId: {
									studentId: id,
									semesterId: semesterId,
								},
							},
						});
					} else {
						// Student will be completely deleted
						await prisma.student.delete({
							where: { userId: existingStudent.userId },
						});

						await prisma.user.delete({
							where: { id: existingStudent.userId },
						});
					}

					const result: StudentResponse = mapStudentV2(existingStudent);

					return result;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(`Student deleted with ID: ${result.id}`);
			this.logger.debug('Deleted Student', JSON.stringify(result));

			// await this.cache.delete(`${CACHE_KEY}/`);
			// await this.cache.delete(`${CACHE_KEY}/${id}`);
			// await this.cache.delete(`${CACHE_KEY}/semester/${semesterId}`);

			return result;
		} catch (error) {
			this.logger.error(`Error deleting student with ID ${id}:`, error);

			throw error;
		}
	}

	// ------------------------------------------------------------------------------------------
	// Additional methods for student management can be added here
	// ------------------------------------------------------------------------------------------

	private async validateMajorForEnrollment(majorId: string): Promise<void> {
		const major = await this.prisma.major.findUnique({
			where: { id: majorId },
		});

		if (!major) {
			throw new NotFoundException(`Major not found`);
		}
	}

	private async validateSemesterForEnrollment(
		semesterId: string,
	): Promise<Semester> {
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
}
