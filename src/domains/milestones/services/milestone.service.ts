import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { mapMilestone } from '@/milestones/mappers';
import { MilestoneResponse } from '@/milestones/responses';
import { PrismaService } from '@/providers';
import { mapSemester } from '@/semesters/mappers';
import { SemesterResponse } from '@/semesters/responses';

import { SemesterStatus } from '~/generated/prisma';

@Injectable()
export class MilestoneService {
	private readonly logger = new Logger(MilestoneService.name);

	constructor(private readonly prisma: PrismaService) {}

	async validateSemesterForModification(semesterId: string): Promise<void> {
		const semester = await this.validateSemester(semesterId);

		if (semester.status !== SemesterStatus.Ongoing) {
			throw new ConflictException(
				`Milestone can only be created/modified in a semester with status ${SemesterStatus.Ongoing}. Current status: ${semester.status}`,
			);
		}
	}

	async validateMilestoneUniqueness(
		semesterId: string,
		startDate: Date,
		endDate: Date,
		name?: string,
		milestoneId?: string,
	): Promise<void> {
		if (name) {
			const duplicateName = await this.prisma.milestone.findFirst({
				where: {
					semesterId,
					name,
					id: milestoneId ? { not: milestoneId } : undefined,
				},
			});
			if (duplicateName) {
				throw new ConflictException(
					'Milestone name already exists in this semester',
				);
			}
		}

		const overlappingMilestone = await this.prisma.milestone.findFirst({
			where: {
				semesterId,
				id: milestoneId ? { not: milestoneId } : undefined,
				OR: [
					{ startDate: { lte: startDate }, endDate: { gt: startDate } },

					{ startDate: { lt: endDate }, endDate: { gte: endDate } },

					{ startDate: { gte: startDate }, endDate: { lte: endDate } },
				],
			},
		});

		if (overlappingMilestone) {
			throw new ConflictException(
				`Milestone time overlaps with existing milestone: ${overlappingMilestone.name}`,
			);
		}
	}

	async validateSemester(semesterId: string): Promise<SemesterResponse> {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});

		if (!semester) {
			this.logger.warn(`Semester with ID ${semesterId} not found`);
			throw new NotFoundException(`Semester not found`);
		}

		return mapSemester(semester);
	}

	async validateMilestone(id: string): Promise<MilestoneResponse> {
		const milestone = await this.prisma.milestone.findUnique({
			where: { id },
		});

		if (!milestone) {
			throw new NotFoundException(`Milestone not found`);
		}

		return mapMilestone(milestone);
	}
}
