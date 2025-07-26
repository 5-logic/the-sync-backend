import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
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
	protected readonly logger = new Logger(ReviewService.name);

	// private static readonly CACHE_KEY = 'cache:review';

	constructor(
		private readonly prisma: PrismaService,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
	) {}
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

			// Lấy group và thesis để tìm supervisor
			let supervisorIds: string[] = [];
			if (submission.groupId) {
				const group = await this.prisma.group.findUnique({
					where: { id: submission.groupId },
					select: {
						thesis: {
							select: {
								supervisions: true,
							},
						},
					},
				});
				if (group?.thesis?.supervisions) {
					supervisorIds = group.thesis.supervisions.map((s) => s.lecturerId);
				}
			}

			const lecturers = await this.prisma.lecturer.findMany({
				where: {
					assignmentReviews: {
						none: {
							submissionId: submissionId,
						},
					},
					...(supervisorIds.length > 0
						? { userId: { notIn: supervisorIds } }
						: {}),
				},
				include: {
					user: true,
				},
			});

			this.logger.log(
				`Found ${lecturers.length} eligible reviewers for submission ID ${submissionId}`,
			);
			this.logger.debug(
				`Eligible reviewers: ${JSON.stringify(lecturers, null, 2)}`,
			);
			return lecturers;
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
			// Validate all submissions exist và milestone chưa end
			const submissionIds = assignments.map((a) => a.submissionId);
			const submissions = await this.prisma.submission.findMany({
				where: { id: { in: submissionIds } },
				include: {
					milestone: {
						select: {
							id: true,
							endDate: true,
						},
					},
				},
			});

			// Kiểm tra milestone đã end chưa
			const now = new Date();
			const endedMilestoneSubmissions = submissions.filter(
				(s) => now > s.milestone?.endDate,
			);
			if (endedMilestoneSubmissions.length > 0) {
				const ids = endedMilestoneSubmissions.map((s) => s.id).join(', ');
				this.logger.warn(
					`Cannot assign reviewers: milestone ended for submissions: ${ids}`,
				);
				throw new BadRequestException(
					'Cannot assign reviewers to submissions whose milestone has ended',
				);
			}

			const results: Array<{
				submissionId: string;
				assignedCount: number;
				reviewerAssignments: { lecturerId: string; isMainReviewer?: boolean }[];
			}> = [];
			let totalAssignedCount = 0;

			for (const assignment of assignments) {
				const submissionId = assignment.submissionId;
				const reviewerAssignments = assignment.reviewerAssignments ?? [];

				// Xóa hết các assignment cũ của submission này
				await this.prisma.assignmentReview.deleteMany({
					where: { submissionId },
				});

				// Nếu không có reviewerAssignments thì bỏ qua tạo mới
				if (reviewerAssignments.length === 0) {
					this.logger.log(
						`No reviewers specified for submission ${submissionId}`,
					);
					results.push({
						submissionId,
						assignedCount: 0,
						reviewerAssignments: [],
					});
					continue;
				}

				// Validate lecturers
				const lecturerIds = reviewerAssignments.map((r) => r.lecturerId);
				await this.validateLecturersExistAndNotSupervisor(
					lecturerIds,
					submissionId,
				);

				// Tạo lại assignment mới
				const assignmentData: Array<{
					reviewerId: string;
					submissionId: string;
					isMainReviewer: boolean;
				}> = reviewerAssignments.slice(0, 2).map((r) => ({
					reviewerId: r.lecturerId,
					submissionId: submissionId,
					isMainReviewer: !!r.isMainReviewer,
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
					reviewerAssignments: reviewerAssignments.slice(0, 2),
				});
			}

			this.logger.log(
				`Bulk assignment completed: ${totalAssignedCount} total assignments across ${assignments.length} submissions`,
			);

			// Clear relevant caches after bulk assignment
			// await this.clearSubmissionRelatedCaches(assignments);

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

	private async validateLecturersExistAndNotSupervisor(
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

	async getAssignedReviews(lecturerId: string) {
		try {
			const assignments = await this.prisma.assignmentReview.findMany({
				where: { reviewerId: lecturerId },
				include: {
					submission: {
						include: {
							group: true,
							milestone: true,
						},
					},
				},
			});

			this.logger.log(
				`Fetched ${assignments.length} assigned reviews for lecturer ID ${lecturerId}`,
			);
			this.logger.debug(`Assignments: ${JSON.stringify(assignments, null, 2)}`);

			return assignments;
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
					group: true,
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

			// Validate reviewer role for review items
			const isMainReviewer = assignment.isMainReviewer;
			const hasReviewItems =
				Array.isArray(reviewDto.reviewItems) &&
				reviewDto.reviewItems.length > 0;
			if (hasReviewItems && isMainReviewer) {
				this.logger.warn(
					`Main reviewer (isMainReviewer=true) is not allowed to submit detailed review items for submission ID ${submissionId}`,
				);
				throw new ForbiddenException(
					'Only the secondary reviewer can submit detailed review items.',
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

				// Only create review items if reviewer is allowed (isMainReviewer === false)
				if (hasReviewItems && !isMainReviewer) {
					const reviewItemsData = reviewDto.reviewItems.map((item) => ({
						reviewId: review.id,
						checklistItemId: item.checklistItemId,
						acceptance: item.acceptance,
						note: item.note,
					}));
					await prisma.reviewItem.createMany({
						data: reviewItemsData,
					});
				}

				// Return review with relations
				return await prisma.review.findUnique({
					where: { id: review.id },
					include: {
						lecturer: {
							include: {
								user: true,
							},
						},
						reviewItems: {
							include: {
								checklistItem: true,
							},
						},
					},
				});
			});

			this.logger.log(
				`Review submitted successfully for submission ID ${submissionId} by lecturer ID ${lecturerId}`,
			);
			this.logger.debug(`Review: ${JSON.stringify(result, null, 2)}`);

			// Clear submission caches since review count has changed
			// await this.clearSubmissionRelatedCaches([{ submissionId }]);

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
	// Both reviewers (main and secondary) are allowed to update feedback and review items
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

			const isReviewer = await this.prisma.assignmentReview.findFirst({
				where: {
					reviewerId: lecturerId,
					submissionId: existingReview.submissionId,
				},
			});

			if (!isReviewer) {
				this.logger.warn(
					`Lecturer ID ${lecturerId} is not assigned to review submission ID ${existingReview.submissionId}`,
				);

				throw new NotFoundException(
					'You are not assigned to review this submission',
				);
			}

			// No isMainReviewer check: both reviewers can update feedback and review items
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
	async getSubmissionReviews(submissionId: string) {
		try {
			const submission = await this.prisma.submission.findFirst({
				where: {
					id: submissionId,
				},
			});

			if (!submission) {
				this.logger.warn(`Submission with ID ${submissionId} does not exist`);
				throw new NotFoundException('Submission does not exist');
			}

			const reviews = await this.prisma.review.findMany({
				where: { submissionId },
				include: {
					lecturer: {
						include: {
							user: true,
						},
					},
					reviewItems: {
						include: {
							checklistItem: true,
						},
					},
					checklist: true,
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(
				`Fetched ${reviews.length} reviews for submission ID ${submissionId}`,
			);
			this.logger.debug(`Reviews: ${JSON.stringify(reviews, null, 2)}`);

			return reviews;
		} catch (error) {
			this.logger.error(
				`Error fetching reviews for submission ID ${submissionId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Update reviewer assignment for a submission (replace existing assignments)
	 */
	async changeReviewer(
		submissionId: string,
		updateDto: UpdateReviewerAssignmentDto,
	) {
		try {
			this.logger.log(
				`Updating reviewer assignments for submission ID ${submissionId}`,
			);

			await this.validateReviewer(
				updateDto.newReviewerId,
				submissionId,
				updateDto.currentReviewerId,
			);

			const existingReviewers = await this.prisma.assignmentReview.findFirst({
				where: {
					submissionId: submissionId,
					reviewerId: updateDto.currentReviewerId,
				},
			});

			if (!existingReviewers) {
				this.logger.warn(
					`No existing reviewer assignment found for submission ID ${submissionId} and reviewer ID ${updateDto.currentReviewerId}`,
				);
				throw new NotFoundException(
					'No existing reviewer assignment found for group',
				);
			}

			const changeReviewer = await this.prisma.assignmentReview.update({
				where: {
					submissionId_reviewerId: {
						submissionId: submissionId,
						reviewerId: updateDto.currentReviewerId,
					},
				},
				data: {
					reviewerId: updateDto.newReviewerId,
				},
			});

			this.logger.log(
				`Reviewer assignment updated successfully for submission ID ${submissionId}`,
			);
			this.logger.debug(
				`Updated assignment: ${JSON.stringify(changeReviewer, null, 2)}`,
			);

			return changeReviewer;
		} catch (error) {
			this.logger.error(
				`Error updating reviewer assignments for submission ID ${submissionId}`,
				error,
			);
			throw error;
		}
	}

	private async validateReviewer(
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

	/**
	 * Clear caches related to submissions and assignments
	 */
	// private async clearSubmissionRelatedCaches(
	// 	assignments: Array<{ submissionId: string; lecturerIds?: string[] }>,
	// ) {
	// 	try {
	// 		const cacheKeysToInvalidate: string[] = [];

	// 		// Clear submission list caches (all variants)
	// 		cacheKeysToInvalidate.push(
	// 			`${ReviewService.CACHE_KEY}:submissions:all:all`,
	// 		);

	// 		// For each assignment, clear related caches
	// 		for (const assignment of assignments) {
	// 			const { submissionId, lecturerIds } = assignment;

	// 			// Clear eligible reviewers cache for this submission
	// 			cacheKeysToInvalidate.push(
	// 				`${ReviewService.CACHE_KEY}:eligible-reviewers:${submissionId}`,
	// 			);

	// 			// Clear review form cache for this submission
	// 			cacheKeysToInvalidate.push(
	// 				`${ReviewService.CACHE_KEY}:review-form:${submissionId}`,
	// 			);

	// 			// Clear assigned reviews cache for each affected lecturer
	// 			if (lecturerIds && lecturerIds.length > 0) {
	// 				for (const lecturerId of lecturerIds) {
	// 					cacheKeysToInvalidate.push(
	// 						`${ReviewService.CACHE_KEY}:assigned-reviews:${lecturerId}`,
	// 					);
	// 				}
	// 			}

	// 			// Get submission to clear semester/milestone specific caches
	// 			const submission = await this.prisma.submission.findUnique({
	// 				where: { id: submissionId },
	// 				include: {
	// 					milestone: {
	// 						select: { id: true, semesterId: true },
	// 					},
	// 				},
	// 			});

	// 			// if (submission) {
	// 			// 	// Clear semester-specific cache
	// 			// 	cacheKeysToInvalidate.push(
	// 			// 		`${ReviewService.CACHE_KEY}:submissions:${submission.milestone.semesterId}:all`,
	// 			// 	);

	// 			// 	// Clear milestone-specific cache
	// 			// 	cacheKeysToInvalidate.push(
	// 			// 		`${ReviewService.CACHE_KEY}:submissions:all:${submission.milestone.id}`,
	// 			// 	);

	// 			// 	// Clear semester+milestone specific cache
	// 			// 	cacheKeysToInvalidate.push(
	// 			// 		`${ReviewService.CACHE_KEY}:submissions:${submission.milestone.semesterId}:${submission.milestone.id}`,
	// 			// 	);
	// 			// }
	// 		}

	// 		// this.logger.log(
	// 		// 	`Cleared ${cacheKeysToInvalidate.length} cache keys for ${assignments.length} assignments`,
	// 		// );
	// 	} catch (error) {
	// 		this.logger.warn('Error clearing submission-related caches', error);
	// 	}
	// }
}
