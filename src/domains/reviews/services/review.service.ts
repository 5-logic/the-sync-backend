import { Inject, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailJobType, EmailQueueService } from '@/queue/email';

@Injectable()
export class ReviewService {
	private readonly logger = new Logger(ReviewService.name);

	constructor(
		private readonly prisma: PrismaService,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
	) {}

	async sendReviewCompletedNotifications(
		submissionId: string,
		reviewerId: string,
		review: any,
	) {
		try {
			const submission = await this.prisma.submission.findUnique({
				where: { id: submissionId },
				include: {
					group: {
						include: {
							studentGroupParticipations: {
								include: {
									student: {
										include: {
											user: {
												select: { id: true, fullName: true, email: true },
											},
										},
									},
								},
							},
						},
					},
					milestone: {
						select: { id: true, name: true },
					},
				},
			});

			if (!submission) {
				this.logger.warn(
					`Submission with ID ${submissionId} not found for email notification`,
				);
				return;
			}

			const reviewer = await this.prisma.lecturer.findUnique({
				where: { userId: reviewerId },
				include: {
					user: {
						select: { id: true, fullName: true, email: true },
					},
				},
			});

			if (!reviewer) {
				this.logger.warn(
					`Reviewer with ID ${reviewerId} not found for email notification`,
				);
				return;
			}

			const emailPromises = submission.group.studentGroupParticipations.map(
				(participation) => {
					const reviewItems =
						review.reviewItems?.map((item: any) => ({
							checklistItemName: item.checklistItem.name,
							acceptance: item.acceptance,
							note: item.note,
						})) || [];

					return this.emailQueueService.sendEmail(
						EmailJobType.SEND_REVIEW_COMPLETED_NOTIFICATION,
						{
							to: participation.student.user.email,
							subject: `Review Completed for ${submission.group.name} - TheSync`,
							context: {
								studentName: participation.student.user.fullName,
								groupName: submission.group.name,
								groupCode: submission.group.code,
								milestoneName: submission.milestone.name,
								reviewerName: reviewer.user.fullName,
								reviewSubmittedAt: review.createdAt.toISOString(),
								feedback: review.feedback,
								reviewItems,
							},
						},
					);
				},
			);

			await Promise.all(emailPromises);

			this.logger.log(
				`Successfully sent ${emailPromises.length} review completed email notifications for submission ${submissionId}`,
			);
		} catch (error) {
			this.logger.error(
				`Error sending review completed notifications for submission ${submissionId}`,
				error,
			);
		}
	}
}
