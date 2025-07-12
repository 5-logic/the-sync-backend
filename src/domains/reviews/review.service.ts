import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import {
	AssignLecturerReviewerDto,
	CreateReviewDto,
	UpdateReviewDto,
} from '@/reviews/dto';

@Injectable()
export class ReviewService {
	private readonly logger = new Logger(ReviewService.name);

	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async getSubmissionsForReview() {
		try {
			const submissions = await this.prisma.submission.findMany({
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
	 * Assign reviewers to a submission
	 */
	async assignReviewer(
		submissionId: string,
		assignDto: AssignLecturerReviewerDto,
	) {
		try {
			const { lecturerIds } = assignDto;

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
				where: { userId: { in: lecturerIds } },
			});

			if (lecturers.length !== lecturerIds.length) {
				this.logger.warn(
					`Some lecturers with IDs ${lecturerIds.join(
						', ',
					)} do not exist or are not lecturers`,
				);
				throw new NotFoundException('Some lecturers not found');
			}

			const assignmentData = lecturerIds.map((lecturerId) => ({
				reviewerId: lecturerId,
				submissionId: submissionId,
			}));

			const assignments = await this.prisma.assignmentReview.createMany({
				data: assignmentData,
				skipDuplicates: true,
			});

			this.logger.log(
				`Assigned ${assignments.count} reviewer(s) to submission successfully`,
			);
			this.logger.debug(`Assignments: ${JSON.stringify(assignments, null, 2)}`);

			return assignments;
		} catch (error) {
			this.logger.error(
				`Error assigning reviewers for submission ID ${submissionId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Unassign reviewers from a submission
	 */
	async unassignReviewer(submissionId: string) {
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

			const deleteResult = await this.prisma.assignmentReview.deleteMany({
				where: { submissionId },
			});

			return deleteResult;
		} catch (error) {
			this.logger.error(
				`Error unassigning reviewers for submission ID ${submissionId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Get assigned reviews for a lecturer
	 */
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
}
