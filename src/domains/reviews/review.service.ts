import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import {
	AssignBulkLecturerReviewerDto,
	CreateReviewDto,
	UpdateReviewDto,
	UpdateReviewerAssignmentDto,
} from '@/reviews/dto';

@Injectable()
export class ReviewService {
	private readonly logger = new Logger(ReviewService.name);

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
	) {}

	async getSubmissionsForReview(semesterId?: string, milestoneId?: string) {
		try {
			const where: any = {};

			if (semesterId) {
				where.milestone = {
					semesterId: semesterId,
				};
			}

			if (milestoneId) {
				if (where.milestone) {
					where.milestone = {
						...where.milestone,
						id: milestoneId,
					};
				} else {
					where.milestoneId = milestoneId;
				}
			}

			const submissions = await this.prisma.submission.findMany({
				where,
				include: {
					group: {
						select: { id: true, name: true, code: true },
					},
					milestone: {
						select: { id: true, name: true },
					},
					_count: {
						select: {
							assignmentReviews: true,
							reviews: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Fetched ${submissions.length} submissions for review`);
			this.logger.debug(`Submissions: ${JSON.stringify(submissions, null, 2)}`);

			return submissions.map((submission) => ({
				id: submission.id,
				status: submission.status,
				documents: submission.documents,
				createdAt: submission.createdAt,
				group: submission.group,
				milestone: submission.milestone,
				assignedReviewers: submission._count.assignmentReviews,
				completedReviews: submission._count.reviews,
			}));
		} catch (error) {
			this.logger.error('Error fetching submissions for review', error);
			throw error;
		}
	}

	/**
	 * Get the list of eligible lecturers for review
	 */
	async getEligibleReviewers(submissionId: string) {
		try {
			const submission = await this.prisma.submission.findUnique({
				where: { id: submissionId },
			});

			if (!submission) {
				this.logger.warn(`Submission with ID ${submissionId} does not exist`);
				throw new NotFoundException(
					`Submission with ID ${submissionId} does not exist`,
				);
			}

			const lecturers = await this.prisma.lecturer.findMany({
				where: {
					assignmentReviews: {
						none: {
							submissionId: submissionId,
						},
					},
				},
				include: {
					user: {
						select: {
							id: true,
							fullName: true,
							email: true,
						},
					},
				},
			});

			this.logger.log(
				`Found ${lecturers.length} eligible reviewers for submission ID ${submissionId}`,
			);
			this.logger.debug(
				`Eligible reviewers: ${JSON.stringify(lecturers, null, 2)}`,
			);

			return lecturers.map((lecturer) => ({
				id: lecturer.userId,
				name: lecturer.user.fullName,
				email: lecturer.user.email,
				isModerator: lecturer.isModerator,
			}));
		} catch (error) {
			this.logger.error(
				`Error fetching eligible reviewers for submission ID ${submissionId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Assign reviewers to multiple submissions
	 */
	async assignBulkReviewer(assignDto: AssignBulkLecturerReviewerDto) {
		try {
			const { assignments } = assignDto;

			// Validate all submissions exist
			const submissionIds = assignments.map((a) => a.submissionId);
			const submissions = await this.prisma.submission.findMany({
				where: { id: { in: submissionIds } },
			});

			if (submissions.length !== submissionIds.length) {
				const foundIds = submissions.map((s) => s.id);
				const missingIds = submissionIds.filter((id) => !foundIds.includes(id));
				this.logger.warn(
					`Some submissions with IDs ${missingIds.join(', ')} do not exist`,
				);
				throw new NotFoundException('Some submissions not found');
			}

			// Process each assignment
			const results: Array<{
				submissionId: string;
				assignedCount: number;
				lecturerIds: string[];
			}> = [];
			let totalAssignedCount = 0;

			for (const assignment of assignments) {
				const { submissionId, lecturerIds } = assignment;

				if (lecturerIds && lecturerIds.length > 0) {
					// Validate lecturers exist
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

					// Create assignment data
					const assignmentData: Array<{
						reviewerId: string;
						submissionId: string;
					}> = lecturerIds.map((lecturerId) => ({
						reviewerId: lecturerId,
						submissionId: submissionId,
					}));

					const submissionAssignments =
						await this.prisma.assignmentReview.createMany({
							data: assignmentData,
							skipDuplicates: true,
						});

					totalAssignedCount += submissionAssignments.count;

					results.push({
						submissionId,
						assignedCount: submissionAssignments.count,
						lecturerIds,
					});

					this.logger.log(
						`Assigned ${submissionAssignments.count} reviewer(s) to submission ${submissionId}`,
					);
				} else {
					// No lecturers specified for this submission
					results.push({
						submissionId,
						assignedCount: 0,
						lecturerIds: [],
					});

					this.logger.log(
						`No reviewers specified for submission ${submissionId}`,
					);
				}
			}

			this.logger.log(
				`Bulk assignment completed: ${totalAssignedCount} total assignments across ${assignments.length} submissions`,
			);

			// Send email notifications to assigned reviewers
			await this.sendReviewerAssignmentNotifications(assignments);

			return {
				totalAssignedCount,
				submissionCount: assignments.length,
				results,
			};
		} catch (error) {
			this.logger.error(
				`Error bulk assigning reviewers for ${assignDto.assignments.length} submissions`,
				error,
			);
			throw error;
		}
	}

	async getAssignedReviews(lecturerId: string) {
		try {
			const assignments = await this.prisma.assignmentReview.findMany({
				where: { reviewerId: lecturerId },
				include: {
					submission: {
						include: {
							group: {
								select: { id: true, name: true, code: true },
							},
							milestone: {
								select: { id: true, name: true },
							},
						},
					},
				},
			});

			this.logger.log(
				`Fetched ${assignments.length} assigned reviews for lecturer ID ${lecturerId}`,
			);
			this.logger.debug(`Assignments: ${JSON.stringify(assignments, null, 2)}`);

			return assignments.map((assignment) => ({
				submissionId: assignment.submissionId,
				submission: assignment.submission,
			}));
		} catch (error) {
			this.logger.error('Error fetching assigned reviews', error);
			throw error;
		}
	}

	/**
	 * Get review form for a submission
	 */
	async getReviewForm(submissionId: string) {
		try {
			const submission = await this.prisma.submission.findUnique({
				where: { id: submissionId },
				include: {
					group: {
						select: { id: true, name: true, code: true },
					},
					milestone: {
						include: {
							checklist: {
								include: {
									checklistItems: true,
								},
							},
						},
					},
				},
			});

			if (!submission) {
				this.logger.warn(`Submission with ID ${submissionId} does not exist`);
				throw new NotFoundException(
					`Submission with ID ${submissionId} does not exist`,
				);
			}

			this.logger.log(`Fetched review form for submission ID ${submissionId}`);
			this.logger.debug(`Submission: ${JSON.stringify(submission, null, 2)}`);

			return submission;
		} catch (error) {
			this.logger.error(
				`Error fetching review form for submission ID ${submissionId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Submit a review with review items
	 */
	async submitReview(
		lecturerId: string,
		submissionId: string,
		reviewDto: CreateReviewDto,
	) {
		try {
			// Check if lecturer is assigned to review this submission
			const assignment = await this.prisma.assignmentReview.findFirst({
				where: {
					reviewerId: lecturerId,
					submissionId: submissionId,
				},
			});

			if (!assignment) {
				this.logger.warn(
					`Lecturer ID ${lecturerId} is not assigned to submission ID ${submissionId}`,
				);
				throw new NotFoundException(
					'You are not assigned to review this submission',
				);
			}

			// Check if review already exists
			const existingReview = await this.prisma.review.findFirst({
				where: {
					lecturerId: lecturerId,
					submissionId: submissionId,
					checklistId: reviewDto.checklistId,
				},
			});

			if (existingReview) {
				this.logger.warn(
					`Review already exists for submission ID ${submissionId} by lecturer ID ${lecturerId}`,
				);
				throw new NotFoundException(
					'You have already submitted a review for this submission',
				);
			}

			// Create review with review items in a transaction
			const result = await this.prisma.$transaction(async (prisma) => {
				// Create the review
				const review = await prisma.review.create({
					data: {
						lecturerId: lecturerId,
						submissionId: submissionId,
						checklistId: reviewDto.checklistId,
						feedback: reviewDto.feedback,
					},
				});

				// Create review items
				const reviewItemsData = reviewDto.reviewItems.map((item) => ({
					reviewId: review.id,
					checklistItemId: item.checklistItemId,
					acceptance: item.acceptance,
					note: item.note,
				}));

				await prisma.reviewItem.createMany({
					data: reviewItemsData,
				});

				// Return review with relations
				return await prisma.review.findUnique({
					where: { id: review.id },
					include: {
						lecturer: {
							include: {
								user: {
									select: { id: true, fullName: true, email: true },
								},
							},
						},
						reviewItems: {
							include: {
								checklistItem: {
									select: { id: true, name: true, description: true },
								},
							},
						},
					},
				});
			});

			this.logger.log(
				`Review submitted successfully for submission ID ${submissionId} by lecturer ID ${lecturerId}`,
			);
			this.logger.debug(`Review: ${JSON.stringify(result, null, 2)}`);

			// Send email notification for review completion
			await this.sendReviewCompletedNotifications(
				submissionId,
				lecturerId,
				result,
			);

			return result;
		} catch (error) {
			this.logger.error(
				`Error submitting review for submission ID ${submissionId} by lecturer ID ${lecturerId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Update a review with review items
	 */
	async updateReview(
		lecturerId: string,
		reviewId: string,
		updateDto: UpdateReviewDto,
	) {
		try {
			const existingReview = await this.prisma.review.findUnique({
				where: { id: reviewId },
				include: {
					reviewItems: true,
				},
			});

			if (!existingReview) {
				this.logger.warn(`Review with ID ${reviewId} does not exist`);
				throw new NotFoundException(
					`Review with ID ${reviewId} does not exist`,
				);
			}

			if (existingReview.lecturerId !== lecturerId) {
				this.logger.warn(
					`Lecturer ID ${lecturerId} is not authorized to update review ID ${reviewId}`,
				);
				throw new NotFoundException(
					'You are not authorized to edit this review',
				);
			}

			// Update review and review items in a transaction
			const result = await this.prisma.$transaction(async (prisma) => {
				// Update the review
				await prisma.review.update({
					where: { id: reviewId },
					data: {
						feedback: updateDto.feedback,
					},
				});

				// Update review items if provided
				if (updateDto.reviewItems && updateDto.reviewItems.length > 0) {
					for (const item of updateDto.reviewItems) {
						if (item.checklistItemId) {
							await prisma.reviewItem.upsert({
								where: {
									reviewId_checklistItemId: {
										reviewId: reviewId,
										checklistItemId: item.checklistItemId,
									},
								},
								update: {
									acceptance: item.acceptance,
									note: item.note,
								},
								create: {
									reviewId: reviewId,
									checklistItemId: item.checklistItemId,
									acceptance: item.acceptance || 'NotAvailable',
									note: item.note,
								},
							});
						}
					}
				}

				// Return updated review with relations
				return await prisma.review.findUnique({
					where: { id: reviewId },
					include: {
						lecturer: {
							include: {
								user: {
									select: { id: true, fullName: true, email: true },
								},
							},
						},
						reviewItems: {
							include: {
								checklistItem: {
									select: { id: true, name: true, description: true },
								},
							},
						},
					},
				});
			});

			this.logger.log(
				`Review ID ${reviewId} updated successfully by lecturer ID ${lecturerId}`,
			);
			this.logger.debug(`Updated Review: ${JSON.stringify(result, null, 2)}`);

			return result;
		} catch (error) {
			this.logger.error(`Error updating review ID ${reviewId}`, error);
			throw error;
		}
	}

	/**
	 * View reviews for a submission
	 */
	async getSubmissionReviews(groupId: string, submissionId: string) {
		try {
			const submission = await this.prisma.submission.findFirst({
				where: {
					id: submissionId,
					groupId: groupId,
				},
			});

			if (!submission) {
				this.logger.warn(
					`Submission with ID ${submissionId} does not exist or does not belong to group ID ${groupId}`,
				);
				throw new NotFoundException(
					'Submission does not exist or does not belong to this group',
				);
			}

			const reviews = await this.prisma.review.findMany({
				where: { submissionId },
				include: {
					lecturer: {
						include: {
							user: {
								select: { id: true, fullName: true, email: true },
							},
						},
					},
					reviewItems: {
						include: {
							checklistItem: {
								select: {
									id: true,
									name: true,
									description: true,
									isRequired: true,
								},
							},
						},
					},
					checklist: {
						select: { id: true, name: true, description: true },
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(
				`Fetched ${reviews.length} reviews for submission ID ${submissionId} in group ID ${groupId}`,
			);
			this.logger.debug(`Reviews: ${JSON.stringify(reviews, null, 2)}`);

			return reviews;
		} catch (error) {
			this.logger.error(
				`Error fetching reviews for submission ID ${submissionId} in group ID ${groupId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Update reviewer assignment for a submission (replace existing assignments)
	 */
	async updateReviewerAssignment(
		submissionId: string,
		updateDto: UpdateReviewerAssignmentDto,
	) {
		try {
			const { lecturerIds } = updateDto;

			const submission = await this.prisma.submission.findUnique({
				where: { id: submissionId },
			});

			if (!submission) {
				this.logger.warn(`Submission with ID ${submissionId} does not exist`);
				throw new NotFoundException(
					`Submission with ID ${submissionId} does not exist`,
				);
			}

			// Validate lecturers exist
			const lecturers = await this.prisma.lecturer.findMany({
				where: { userId: { in: lecturerIds } },
			});

			if (lecturers.length !== lecturerIds.length) {
				this.logger.warn(
					`Some lecturers with IDs ${lecturerIds.join(', ')} do not exist or are not lecturers`,
				);
				throw new NotFoundException('Some lecturers not found');
			}

			// Use transaction to remove old assignments and create new ones
			const result = await this.prisma.$transaction(async (prisma) => {
				// Remove existing assignments
				await prisma.assignmentReview.deleteMany({
					where: { submissionId },
				});

				// Create new assignments
				const assignmentData = lecturerIds.map((lecturerId) => ({
					reviewerId: lecturerId,
					submissionId: submissionId,
				}));

				const assignments = await prisma.assignmentReview.createMany({
					data: assignmentData,
				});

				return assignments;
			});

			this.logger.log(
				`Updated reviewer assignments for submission ID ${submissionId}: assigned ${result.count} reviewer(s)`,
			);
			this.logger.debug(
				`Updated assignments: ${JSON.stringify(result, null, 2)}`,
			);

			// Send email notifications to newly assigned reviewers
			if (lecturerIds.length > 0) {
				await this.sendReviewerAssignmentNotifications([
					{ submissionId, lecturerIds },
				]);
			}

			return {
				assignedCount: result.count,
				submissionId,
				lecturerIds,
			};
		} catch (error) {
			this.logger.error(
				`Error updating reviewer assignments for submission ID ${submissionId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Send email notifications to assigned reviewers
	 */
	private async sendReviewerAssignmentNotifications(
		assignments: Array<{ submissionId: string; lecturerIds?: string[] }>,
	) {
		try {
			// Group assignments by lecturer
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

			// Send email to each lecturer
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
			// Don't throw error to prevent assignment from failing
		}
	}

	/**
	 * Send email notification to a specific reviewer
	 */
	private async sendReviewerAssignmentEmail(
		lecturerId: string,
		submissionIds: string[],
	) {
		try {
			// Get lecturer details
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

			// Get submission details
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
						loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
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

	/**
	 * Send email notifications when a review is completed
	 */
	private async sendReviewCompletedNotifications(
		submissionId: string,
		reviewerId: string,
		review: any,
	) {
		try {
			// Get submission and group details
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

			// Get reviewer details
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

			// Send email to all group members
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
								loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
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
