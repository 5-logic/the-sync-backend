import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class SubmissionService {
	private readonly logger = new Logger(SubmissionService.name);

	constructor(private readonly prisma: PrismaService) {}

	async executeWithErrorHandling<T>(
		operation: string,
		fn: () => Promise<T>,
	): Promise<T> {
		try {
			this.logger.log(operation);
			return await fn();
		} catch (error) {
			this.logger.error(`Error ${operation.toLowerCase()}`, error);
			throw error;
		}
	}

	async validateUserRole(userId: string): Promise<boolean> {
		const [admin, lecturer] = await Promise.all([
			this.prisma.admin.findUnique({
				where: { id: userId },
			}),
			this.prisma.lecturer.findUnique({
				where: { userId: userId },
			}),
		]);

		return !!(admin || lecturer);
	}

	public static readonly basicGroupSelect = {
		id: true,
		code: true,
		name: true,
	};

	public static readonly basicMilestoneSelect = {
		id: true,
		name: true,
		startDate: true,
		endDate: true,
	};

	public static readonly userSelect = {
		id: true,
		fullName: true,
	};

	public static readonly reviewerInclude = {
		select: {
			reviewerId: true,
			submissionId: true,
			reviewer: {
				select: {
					user: {
						select: SubmissionService.userSelect,
					},
				},
			},
		},
	};

	public static readonly basicReviewInclude = {
		select: {
			id: true,
			feedback: true,
			lecturer: {
				select: {
					user: {
						select: SubmissionService.userSelect,
					},
				},
			},
		},
	};

	public static readonly listSubmissionInclude = {
		group: {
			select: {
				...SubmissionService.basicGroupSelect,
				semester: {
					select: {
						id: true,
						name: true,
						code: true,
					},
				},
			},
		},
		milestone: {
			select: SubmissionService.basicMilestoneSelect,
		},
		assignmentReviews: SubmissionService.reviewerInclude,
		reviews: SubmissionService.basicReviewInclude,
	};

	public static readonly detailedSubmissionInclude = {
		group: {
			select: {
				...SubmissionService.basicGroupSelect,
				semester: {
					select: {
						id: true,
						name: true,
						code: true,
						status: true,
					},
				},
			},
		},
		milestone: {
			select: SubmissionService.basicMilestoneSelect,
		},
		assignmentReviews: {
			include: {
				reviewer: {
					select: {
						user: {
							select: SubmissionService.userSelect,
						},
					},
				},
			},
		},
		reviews: {
			include: {
				lecturer: {
					select: {
						user: {
							select: SubmissionService.userSelect,
						},
					},
				},
				checklist: {
					select: {
						id: true,
						name: true,
						description: true,
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
			},
		},
	};
}
