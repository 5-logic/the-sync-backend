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
}
