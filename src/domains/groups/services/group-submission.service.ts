import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { SubmissionService } from '@/submissions/services/submission.service';

import { SemesterStatus } from '~/generated/prisma';

@Injectable()
export class GroupSubmissionService {
	private readonly logger = new Logger(GroupSubmissionService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly submissionService: SubmissionService,
	) {}

	async validateCreateSubmissionData(
		groupId: string,
		milestoneId: string,
		documents?: string[],
		userId?: string,
	): Promise<void> {
		if (userId) {
			await this.validateGroupLeadership(userId, groupId);
		}

		await this.validateCreateSubmissionTimeline(milestoneId);
		await this.validateGroupAndMilestoneExistence(groupId, milestoneId);

		if (documents) {
			GroupSubmissionService.validateDocuments(documents);
		}
	}

	async validateGroupLeadership(
		userId: string,
		groupId: string,
	): Promise<void> {
		const participation = await this.findGroupParticipation(
			userId,
			groupId,
			true,
		);

		if (!participation) {
			throw new ForbiddenException(
				'Only group leaders can create or update submissions',
			);
		}
	}

	async validateCreateSubmissionTimeline(milestoneId: string): Promise<void> {
		const milestone = await this.findMilestoneWithSemester(milestoneId);

		if (!milestone) {
			throw new NotFoundException('Milestone not found');
		}

		const now = new Date();

		if (now >= milestone.endDate) {
			throw new ConflictException(
				`Submission creation is only allowed before the milestone end date. End date: ${milestone.endDate.toISOString()}`,
			);
		}

		if (milestone.semester.status !== SemesterStatus.Ongoing) {
			throw new ConflictException(
				`Submissions are only allowed during ongoing semesters. Current semester status: ${milestone.semester.status}`,
			);
		}
	}

	public static readonly groupParticipationInclude = {
		group: {
			include: {
				semester: true,
			},
		},
	};

	async validateGroupAndMilestoneExistence(
		groupId: string,
		milestoneId: string,
	): Promise<{ group: any; milestone: any }> {
		const [group, milestone] = await Promise.all([
			this.prisma.group.findUnique({
				where: { id: groupId },
				include: { semester: true },
			}),
			this.prisma.milestone.findUnique({
				where: { id: milestoneId },
				include: { semester: true },
			}),
		]);

		if (!group) {
			throw new NotFoundException('Group not found');
		}

		if (!milestone) {
			throw new NotFoundException('Milestone not found');
		}

		if (group.semesterId !== milestone.semesterId) {
			throw new ConflictException(
				'Group and milestone must be in the same semester',
			);
		}

		return { group, milestone };
	}

	async findGroupParticipation(
		userId: string,
		groupId: string,
		isLeader?: boolean,
	) {
		const where: any = {
			studentId: userId,
			groupId: groupId,
		};

		if (isLeader !== undefined) {
			where.isLeader = isLeader;
		}

		return this.prisma.studentGroupParticipation.findFirst({
			where,
			include: GroupSubmissionService.groupParticipationInclude,
		});
	}

	async findMilestoneWithSemester(milestoneId: string) {
		return this.prisma.milestone.findUnique({
			where: { id: milestoneId },
			include: {
				semester: true,
			},
		});
	}

	async findSubmissionByCompositeKey(groupId: string, milestoneId: string) {
		return this.prisma.submission.findUnique({
			where: {
				groupId_milestoneId: {
					groupId,
					milestoneId,
				},
			},
		});
	}

	async validateUpdateSubmissionData(
		groupId: string,
		milestoneId: string,
		documents?: string[],
		userId?: string,
	): Promise<void> {
		if (userId) {
			await this.validateGroupLeadership(userId, groupId);
		}

		await this.validateUpdateSubmissionTimeline(milestoneId);
		await this.validateGroupAndMilestoneExistence(groupId, milestoneId);

		if (documents) {
			GroupSubmissionService.validateDocuments(documents);
		}
	}

	async validateUpdateSubmissionTimeline(milestoneId: string): Promise<void> {
		const milestone = await this.findMilestoneWithSemester(milestoneId);

		if (!milestone) {
			throw new NotFoundException('Milestone not found');
		}

		const now = new Date();

		if (now > milestone.endDate) {
			throw new ConflictException(
				`Submission updates are only allowed before the milestone end date. End date: ${milestone.endDate.toISOString()}`,
			);
		}

		if (milestone.semester.status !== SemesterStatus.Ongoing) {
			throw new ConflictException(
				`Submissions are only allowed during ongoing semesters. Current semester status: ${milestone.semester.status}`,
			);
		}
	}

	public static validateDocuments(documents: string[]): void {
		if (!documents || documents.length === 0) {
			return;
		}

		for (const doc of documents) {
			if (typeof doc !== 'string' || doc.trim() === '') {
				throw new ConflictException('All documents must be non-empty strings');
			}
		}
	}
}
