import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers';
import { SubmissionService } from '@/submissions/services/submission.service';

@Injectable()
export class GroupSubmissionPublicService {
	private readonly logger = new Logger(GroupSubmissionPublicService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly submissionService: SubmissionService,
	) {}

	async findGroupSubmissions(groupId: string) {
		return await this.submissionService.executeWithErrorHandling(
			`Finding submissions for group: ${groupId}`,
			async () => {
				const submissions = await this.prisma.submission.findMany({
					where: { groupId },
					include: {
						milestone: {
							select: SubmissionService.basicMilestoneSelect,
						},
						assignmentReviews: SubmissionService.reviewerInclude,
						reviews: SubmissionService.basicReviewInclude,
					},
					orderBy: {
						createdAt: 'desc',
					},
				});

				this.logger.log(
					`Found ${submissions.length} submissions for group ${groupId}`,
				);
				return submissions;
			},
		);
	}

	async findSubmissionForMilestone(groupId: string, milestoneId: string) {
		return await this.submissionService.executeWithErrorHandling(
			`Finding submission for group: ${groupId}, milestone: ${milestoneId}`,
			async () => {
				const submission = await this.prisma.submission.findUnique({
					where: {
						groupId_milestoneId: {
							groupId,
							milestoneId,
						},
					},
					include: SubmissionService.detailedSubmissionInclude,
				});

				if (!submission) {
					throw new NotFoundException(
						`Submission not found for group ${groupId} and milestone ${milestoneId}`,
					);
				}

				this.logger.log(`Found submission with ID: ${submission.id}`);
				return submission;
			},
		);
	}
}
