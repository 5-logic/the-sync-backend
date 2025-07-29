import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

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

	async validateLecturersExistAndNotSupervisor(
		lecturerIds: string[],
		submissionId: string,
	) {
		const lecturers = await this.prisma.lecturer.findMany({
			where: { userId: { in: lecturerIds } },
		});
		if (lecturers.length !== lecturerIds.length) {
			const foundLecturerIds = lecturers.map((l) => l.userId);
			const missingLecturerIds = lecturerIds.filter(
				(id) => !foundLecturerIds.includes(id),
			);
			this.logger.warn(
				`Some lecturers with IDs ${missingLecturerIds.join(', ')} do not exist or are not lecturers`,
			);
			throw new NotFoundException(
				`Some lecturers not found for submission ${submissionId}`,
			);
		}
		for (const lecturerId of lecturerIds) {
			await this.validateReviewer(lecturerId, submissionId);
		}
	}

	async validateReviewer(
		newReviewerId: string,
		submissionId: string,
		currentReviewerId?: string,
	) {
		if (currentReviewerId === newReviewerId) {
			this.logger.warn(
				'Current reviewer and new reviewer are the same, no update needed',
			);
			throw new BadRequestException(
				'Current reviewer and new reviewer are the same',
			);
		}

		if (currentReviewerId) {
			const currentReviewer = await this.prisma.lecturer.findUnique({
				where: { userId: currentReviewerId },
			});

			this.logger.log(
				`Validating current reviewer with ID ${currentReviewerId}`,
			);

			if (!currentReviewer) {
				this.logger.warn(
					`Current reviewer with ID ${currentReviewerId} does not exist`,
				);
				throw new NotFoundException('Current reviewer does not exist');
			}
		}

		const newReviewer = await this.prisma.lecturer.findUnique({
			where: { userId: newReviewerId },
		});

		if (!newReviewer) {
			this.logger.warn(`New reviewer with ID ${newReviewerId} does not exist`);
			throw new NotFoundException('New reviewer does not exist');
		}

		const supervisorIds = await this.prisma.submission.findUnique({
			where: { id: submissionId },
			select: {
				group: {
					select: {
						thesis: {
							select: {
								supervisions: {
									select: {
										lecturerId: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (
			supervisorIds?.group?.thesis?.supervisions.some(
				(s) => s.lecturerId === newReviewerId,
			)
		) {
			this.logger.warn(
				`New reviewer with ID ${newReviewerId} is a supervisor of the submission`,
			);
			throw new BadRequestException(
				'New reviewer cannot be a supervisor of the submission',
			);
		}

		const existingReview = await this.prisma.assignmentReview.findFirst({
			where: {
				submissionId: submissionId,
				reviewerId: newReviewerId,
			},
		});

		if (existingReview) {
			this.logger.warn(
				`Reviewer with ID ${newReviewerId} is already assigned to submission ID ${submissionId}`,
			);
			throw new ConflictException('Reviewer is already assigned to this group');
		}
	}

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

	async sendReviewerAssignmentNotifications(
		assignments: Array<{ submissionId: string; lecturerIds?: string[] }>,
	) {
		try {
			const lecturerAssignments = new Map<string, string[]>();

			for (const assignment of assignments) {
				if (assignment.lecturerIds && assignment.lecturerIds.length > 0) {
					for (const lecturerId of assignment.lecturerIds) {
						if (!lecturerAssignments.has(lecturerId)) {
							lecturerAssignments.set(lecturerId, []);
						}
						lecturerAssignments.get(lecturerId)!.push(assignment.submissionId);
					}
				}
			}

			const emailPromises: Promise<void>[] = [];
			for (const [lecturerId, submissionIds] of lecturerAssignments) {
				const emailPromise = this.sendReviewerAssignmentEmail(
					lecturerId,
					submissionIds,
				);
				emailPromises.push(emailPromise);
			}

			await Promise.all(emailPromises);

			this.logger.log(
				`Successfully sent ${emailPromises.length} reviewer assignment email notifications`,
			);
		} catch (error) {
			this.logger.error(
				'Error sending reviewer assignment notifications',
				error,
			);
		}
	}

	private async sendReviewerAssignmentEmail(
		lecturerId: string,
		submissionIds: string[],
	) {
		try {
			const lecturer = await this.prisma.lecturer.findUnique({
				where: { userId: lecturerId },
				include: {
					user: {
						select: { id: true, fullName: true, email: true },
					},
				},
			});

			if (!lecturer) {
				this.logger.warn(
					`Lecturer with ID ${lecturerId} not found for email notification`,
				);
				return;
			}

			const submissions = await this.prisma.submission.findMany({
				where: { id: { in: submissionIds } },
				include: {
					group: {
						select: { id: true, name: true, code: true },
					},
					milestone: {
						select: { id: true, name: true },
					},
				},
			});

			const submissionDetails = submissions.map((submission) => ({
				groupName: submission.group.name,
				groupCode: submission.group.code,
				milestoneName: submission.milestone.name,
				submittedAt: submission.createdAt.toISOString(),
				documents: submission.documents || [],
			}));

			await this.emailQueueService.sendEmail(
				EmailJobType.SEND_REVIEWER_ASSIGNMENT_NOTIFICATION,
				{
					to: lecturer.user.email,
					subject: `New Review Assignment - TheSync`,
					context: {
						lecturerName: lecturer.user.fullName,
						submissions: submissionDetails,
					},
				},
			);

			this.logger.log(
				`Sent reviewer assignment email to ${lecturer.user.email} for ${submissionIds.length} submissions`,
			);
		} catch (error) {
			this.logger.error(
				`Error sending reviewer assignment email to lecturer ${lecturerId}`,
				error,
			);
		}
	}
}
