import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class ReviewPublicService {
	private readonly logger = new Logger(ReviewPublicService.name);

	constructor(private readonly prisma: PrismaService) {}

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

			const assignmentReviews = await this.prisma.assignmentReview.findMany({
				where: { submissionId },
				include: {
					reviewer: {
						include: {
							user: true,
						},
					},
				},
				orderBy: { isMainReviewer: 'desc' },
			});

			const reviews = await this.prisma.review.findMany({
				where: { submissionId },
				include: {
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
				`Fetched ${assignmentReviews.length} assignment reviews for submission ID ${submissionId}`,
			);
			this.logger.debug(
				`Assignment Reviews: ${JSON.stringify(assignmentReviews, null, 2)}`,
			);

			return {
				assignmentReviews,
				reviews,
			};
		} catch (error) {
			this.logger.error(
				`Error fetching reviews for submission ID ${submissionId}`,
				error,
			);
			throw error;
		}
	}
}
