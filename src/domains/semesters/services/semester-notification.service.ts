import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailJobType, EmailQueueService } from '@/queue';

@Injectable()
export class SemesterNotificationService {
	private readonly logger = new Logger(SemesterNotificationService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly emailQueueService: EmailQueueService,
	) {}

	/**
	 * Gửi email thông báo semester chuyển sang trạng thái Preparing cho tất cả lecturers
	 */
	async sendSemesterPreparingNotifications(semester: any): Promise<void> {
		try {
			this.logger.log(
				`Sending semester preparing notifications for semester ${semester.name} (${semester.code})`,
			);

			// Lấy tất cả lecturers active
			const lecturers = await this.prisma.lecturer.findMany({
				include: {
					user: {
						select: { id: true, fullName: true, email: true },
					},
				},
			});

			// Gửi email cho từng lecturer
			for (const lecturer of lecturers) {
				if (lecturer.user.email) {
					await this.emailQueueService.sendEmail(
						EmailJobType.SEND_SEMESTER_PREPARING_NOTIFICATION,
						{
							to: lecturer.user.email,
							subject: `Semester ${semester.name} - Preparing Phase Started`,
							context: {
								lecturerName: lecturer.user.fullName,
								semesterName: semester.name,
								semesterCode: semester.code,
								preparingDeadline: 'Please check system for deadline',
								maxThesisCount: semester.maxThesesPerLecturer,
							},
						},
					);
				}
			}

			this.logger.log(
				`Semester preparing notifications sent to ${lecturers.length} lecturers`,
			);
		} catch (error) {
			this.logger.error(
				'Failed to send semester preparing notification emails',
				error,
			);
		}
	}

	/**
	 * Gửi email thông báo semester chuyển sang trạng thái Picking cho tất cả students enrolled
	 */
	async sendSemesterPickingNotifications(semester: any): Promise<void> {
		try {
			this.logger.log(
				`Sending semester picking notifications for semester ${semester.name} (${semester.code})`,
			);

			// Lấy tất cả students enrolled trong semester này
			const enrollments = await this.prisma.enrollment.findMany({
				where: { semesterId: semester.id },
				include: {
					student: {
						include: {
							user: {
								select: { id: true, fullName: true, email: true },
							},
							studentGroupParticipations: {
								where: { semesterId: semester.id },
								include: {
									group: true,
								},
							},
						},
					},
				},
			});

			// Đếm số thesis available
			const availableThesisCount = await this.prisma.thesis.count({
				where: {
					semesterId: semester.id,
					isPublish: true,
				},
			});

			// Gửi email cho từng student
			for (const enrollment of enrollments) {
				if (enrollment.student.user.email) {
					const groupParticipation =
						enrollment.student.studentGroupParticipations[0];
					const group = groupParticipation?.group;

					// Xác định recipient type
					let recipientType = 'individual_student';
					if (group) {
						recipientType = groupParticipation.isLeader
							? 'group_leader'
							: 'group_member';
					}

					await this.emailQueueService.sendEmail(
						EmailJobType.SEND_SEMESTER_PICKING_NOTIFICATION,
						{
							to: enrollment.student.user.email,
							subject: `Semester ${semester.name} - Thesis Picking Phase Started`,
							context: {
								recipientName: enrollment.student.user.fullName,
								recipientType,
								groupName: group?.name,
								groupCode: group?.code,
								semesterName: semester.name,
								semesterCode: semester.code,
								pickingDeadline: 'Please check system for deadline',
								availableThesisCount,
							},
						},
					);
				}
			}

			this.logger.log(
				`Semester picking notifications sent to ${enrollments.length} students`,
			);
		} catch (error) {
			this.logger.error(
				'Failed to send semester picking notification emails',
				error,
			);
		}
	}

	/**
	 * Gửi email thông báo semester chuyển sang trạng thái Ongoing cho tất cả participants
	 */
	async sendSemesterOngoingNotifications(semester: any): Promise<void> {
		try {
			this.logger.log(
				`Sending semester ongoing notifications for semester ${semester.name} (${semester.code})`,
			);

			// Lấy tất cả students enrolled và có group
			const enrollments = await this.prisma.enrollment.findMany({
				where: { semesterId: semester.id },
				include: {
					student: {
						include: {
							user: {
								select: { id: true, fullName: true, email: true },
							},
							studentGroupParticipations: {
								where: { semesterId: semester.id },
								include: {
									group: {
										include: {
											thesis: {
												include: {
													lecturer: {
														include: {
															user: {
																select: { fullName: true },
															},
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			});

			// Gửi email cho students
			for (const enrollment of enrollments) {
				if (enrollment.student.user.email) {
					const groupParticipation =
						enrollment.student.studentGroupParticipations[0];
					const group = groupParticipation?.group;
					const thesis = group?.thesis;

					if (group) {
						await this.emailQueueService.sendEmail(
							EmailJobType.SEND_SEMESTER_ONGOING_NOTIFICATION,
							{
								to: enrollment.student.user.email,
								subject: `Semester ${semester.name} - Ongoing Phase Started`,
								context: {
									recipientName: enrollment.student.user.fullName,
									recipientType: 'student',
									semesterName: semester.name,
									semesterCode: semester.code,
									groupName: group.name,
									groupCode: group.code,
									thesisTitle: thesis?.vietnameseName || thesis?.englishName,
									supervisorName: thesis?.lecturer?.user?.fullName,
								},
							},
						);
					}
				}
			}

			// Lấy tất cả lecturers có thesis được pick trong semester này
			const lecturersWithPickedThesis = await this.prisma.lecturer.findMany({
				where: {
					theses: {
						some: {
							semesterId: semester.id,
							groupId: { not: null }, // thesis đã được pick
						},
					},
				},
				include: {
					user: {
						select: { id: true, fullName: true, email: true },
					},
				},
			});

			// Gửi email cho lecturers
			for (const lecturer of lecturersWithPickedThesis) {
				if (lecturer.user.email) {
					await this.emailQueueService.sendEmail(
						EmailJobType.SEND_SEMESTER_ONGOING_NOTIFICATION,
						{
							to: lecturer.user.email,
							subject: `Semester ${semester.name} - Ongoing Phase Started`,
							context: {
								recipientName: lecturer.user.fullName,
								recipientType: 'lecturer',
								semesterName: semester.name,
								semesterCode: semester.code,
							},
						},
					);
				}
			}

			this.logger.log(
				`Semester ongoing notifications sent to ${enrollments.length} students and ${lecturersWithPickedThesis.length} lecturers`,
			);
		} catch (error) {
			this.logger.error(
				'Failed to send semester ongoing notification emails',
				error,
			);
		}
	}
}
