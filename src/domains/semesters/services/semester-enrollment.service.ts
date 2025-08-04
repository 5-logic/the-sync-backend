import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailJobType, EmailQueueService } from '@/queue';
import { UpdateEnrollmentsDto } from '@/semesters/dto';

import { OngoingPhase, Semester, SemesterStatus } from '~/generated/prisma';

@Injectable()
export class SemesterEnrollmentService {
	private readonly logger = new Logger(SemesterEnrollmentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly emailQueueService: EmailQueueService,
	) {}

	async findGroups(semesterId: string) {
		this.logger.log(`Finding groups for semester ID: ${semesterId}`);
		try {
			const groups = await this.prisma.group.findMany({
				where: { semesterId },
				include: {
					studentGroupParticipations: {
						include: {
							student: {
								include: {
									major: true,
									user: true,
									enrollments: {
										where: { semesterId },
									},
								},
							},
						},
					},
					thesis: {
						include: {
							supervisions: {
								include: {
									lecturer: {
										include: { user: true },
									},
								},
							},
						},
					},
				},
			});
			return groups;
		} catch (error) {
			this.logger.error(
				`Failed to find groups for semester ID: ${semesterId}`,
				error,
			);
			throw new NotFoundException(
				`Groups for semester ID ${semesterId} not found`,
			);
		}
	}

	async update(id: string, dto: UpdateEnrollmentsDto) {
		this.logger.log(`Updating enrollments for semester ID: ${id}`);

		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id: id },
			});

			this.logger.debug(`Found semester: ${JSON.stringify(semester)}`);

			this.validateSemesterExists(semester);
			await this.validateOtherSemestersStatus(id);

			const result = await this.prisma.enrollment.updateMany({
				where: {
					studentId: { in: dto.studentIds },
					semesterId: id,
				},
				data: {
					status: dto.status,
				},
			});

			this.logger.log(
				`Updated ${result.count} enrollments for semester ID: ${id}`,
			);

			// Gửi email thông báo kết quả enrollment cho từng student
			await this.sendEnrollmentResultNotifications(
				dto.studentIds,
				id,
				dto.status,
			);

			return result;
		} catch (error) {
			this.logger.error(
				`Failed to update enrollments for semester ID: ${id}`,
				error,
			);

			throw error;
		}
	}

	private validateSemesterExists(semester: Semester | null) {
		if (!semester) {
			const message = 'Semester not found';
			this.logger.warn(message);

			throw new NotFoundException(message);
		}

		if (
			semester.status !== SemesterStatus.Ongoing ||
			semester.ongoingPhase !== 'ScopeLocked'
		) {
			this.logger.warn(
				`Cannot update enrollments for semester ${semester.id}: status is ${semester.status}, must be ${SemesterStatus.Ongoing}`,
			);

			throw new ConflictException(
				`Cannot update enrollments: semester status must be ${SemesterStatus.Ongoing} & phase must be Scope Locked`,
			);
		}
	}

	private async validateOtherSemestersStatus(
		currentSemesterId: string,
	): Promise<void> {
		this.logger.log(
			`Validating other semesters status for current semester: ${currentSemesterId}`,
		);

		const otherSemesters = await this.prisma.semester.findMany({
			where: {
				id: { not: currentSemesterId },
			},
		});

		for (const semester of otherSemesters) {
			// Tất cả các kỳ khác phải có status là NotYet hoặc End
			if (
				semester.status !== SemesterStatus.NotYet &&
				semester.status !== SemesterStatus.End
			) {
				// Nếu có kỳ khác đang Ongoing, thì phase phải là ScopeLocked
				if (semester.status === SemesterStatus.Ongoing) {
					if (semester.ongoingPhase !== OngoingPhase.ScopeLocked) {
						this.logger.warn(
							`Cannot update enrollments. Other semester ${semester.id} is in ${semester.status} status with phase ${semester.ongoingPhase}, but phase must be ScopeLocked`,
						);

						throw new ConflictException(
							`Cannot update enrollments. Other semester (${semester.name}) is in ${semester.status} status with phase ${semester.ongoingPhase}. Phase must be Scope Locked to allow enrollment updates.`,
						);
					}
				} else {
					// Các trạng thái khác (Preparing, Picking) không được phép
					this.logger.warn(
						`Cannot update enrollments. Other semester ${semester.id} is in ${semester.status} status`,
					);

					throw new ConflictException(
						`Cannot update enrollments. Other semester (${semester.name}) is in ${semester.status} status. Only semesters with NotYet, End, or Ongoing (ScopeLocked) status are allowed.`,
					);
				}
			}
		}

		this.logger.log(
			`Other semesters status validation passed for semester: ${currentSemesterId}`,
		);
	}

	private async sendEnrollmentResultNotifications(
		studentIds: string[],
		semesterId: string,
		enrollmentStatus: string,
	): Promise<void> {
		try {
			this.logger.log(
				`Sending enrollment result notifications for ${studentIds.length} students`,
			);

			// Lấy thông tin chi tiết của students và semester
			const enrollments = await this.prisma.enrollment.findMany({
				where: {
					studentId: { in: studentIds },
					semesterId: semesterId,
				},
				include: {
					student: {
						include: {
							user: {
								select: { fullName: true, email: true },
							},
							studentGroupParticipations: {
								where: { semesterId: semesterId },
								include: {
									group: {
										include: {
											thesis: {
												select: {
													englishName: true,
													abbreviation: true,
												},
											},
										},
									},
								},
							},
						},
					},
					semester: {
						select: {
							name: true,
							code: true,
						},
					},
				},
			});

			// Gửi email cho từng student
			for (const enrollment of enrollments) {
				const student = enrollment.student;
				const semester = enrollment.semester;
				const groupParticipation = student.studentGroupParticipations[0];
				const thesis = groupParticipation?.group?.thesis;

				// Xác định text hiển thị cho enrollment status
				let enrollmentStatusText = '';
				if (enrollmentStatus === 'Passed') {
					enrollmentStatusText = 'PASSED';
				} else if (enrollmentStatus === 'Failed') {
					enrollmentStatusText = 'NOT PASSED';
				} else {
					enrollmentStatusText = enrollmentStatus;
				}

				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_ENROLLMENT_RESULT_NOTIFICATION,
					{
						to: student.user.email,
						subject: `Capstone Project Result - ${semester.name}`,
						context: {
							fullName: student.user.fullName,
							enrollmentStatus: enrollmentStatus,
							semesterName: semester.name,
							semesterCode: semester.code,
							studentEmail: student.user.email,
							thesisEnglishName: thesis?.englishName || 'N/A',
							thesisAbbreviation: thesis?.abbreviation || 'N/A',
							enrollmentStatusText: enrollmentStatusText,
						},
					},
					500, // delay 500ms
				);

				this.logger.log(
					`Enrollment result notification sent to ${student.user.email}`,
				);
			}

			this.logger.log(`All enrollment result notifications sent successfully`);
		} catch (error) {
			this.logger.error(
				'Failed to send enrollment result notifications:',
				error,
			);
			// Không throw error để không làm fail update enrollment process
		}
	}
}
