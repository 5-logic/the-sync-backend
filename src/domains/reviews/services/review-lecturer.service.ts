import {
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { CreateReviewDto, UpdateReviewDto } from '@/reviews/dtos';
import { ReviewService } from '@/reviews/services/review.service';

@Injectable()
export class ReviewLecturerService {
	private readonly logger = new Logger(ReviewLecturerService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly reviewService: ReviewService,
	) {}

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

	async submitReview(
		lecturerId: string,
		submissionId: string,
		reviewDto: CreateReviewDto,
	) {
		try {
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

			const result = await this.prisma.$transaction(async (prisma) => {
				const review = await prisma.review.create({
					data: {
						lecturerId: lecturerId,
						submissionId: submissionId,
						checklistId: reviewDto.checklistId,
						feedback: reviewDto.feedback,
					},
				});

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

			await this.reviewService.sendReviewCompletedNotifications(
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

			const result = await this.prisma.$transaction(async (prisma) => {
				await prisma.review.update({
					where: { id: reviewId },
					data: {
						feedback: updateDto.feedback,
					},
				});

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
}
