import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailJobDto, EmailJobType, EmailQueueService } from '@/queue';
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
		private readonly prisma: PrismaService,
		private readonly email: EmailQueueService,
	) {}

	async create(dto: CreateStudentDto): Promise<StudentResponse> {
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
			this.logger.debug('Student detail', JSON.stringify(result));

			return result;
		} catch (error) {
			this.logger.error('Error creating student', error);

			throw error;
		}
	}

	async createMany(dto: ImportStudentDto): Promise<StudentResponse[]> {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async updateByAdmin(
		id: string,
		dto: UpdateStudentDto,
	): Promise<StudentResponse> {
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

				const result: StudentResponse = mapStudentV1(
					updatedUser,
					updatedStudent,
				);

				return result;
			});

			this.logger.log(`Student updated with ID: ${result.id}`);
			this.logger.debug('Updated Student', JSON.stringify(result));

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
			const result = await this.prisma.$transaction(async (prisma) => {
				const existingStudent = await prisma.student.findUnique({
					where: { userId: id },
				});

				if (!existingStudent) {
					this.logger.warn(`Student with ID ${id} not found for status toggle`);

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
			});

			this.logger.log(
				`Student status updated - ID: ${id}, isActive: ${dto.isActive}`,
			);
			this.logger.debug('Updated student status', JSON.stringify(result));

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
			const result = await this.prisma.$transaction(async (prisma) => {
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
					await prisma.student.delete({
						where: { userId: existingStudent.userId },
					});

					await prisma.user.delete({
						where: { id: existingStudent.userId },
					});
				}

				const result: StudentResponse = mapStudentV2(existingStudent);

				return result;
			});

			this.logger.log(`Student deleted with ID: ${result.id}`);
			this.logger.debug('Deleted Student', JSON.stringify(result));

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
