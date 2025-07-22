import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { mapMilestone } from '@/milestones/mappers';
import { MilestoneResponse } from '@/milestones/responses';
import { MilestoneService } from '@/milestones/services/milestone.service';
import { PrismaService } from '@/providers';

@Injectable()
export class MilestonePublicService {
	private readonly logger = new Logger(MilestonePublicService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly milestoneService: MilestoneService,
	) {}

	async findAll(): Promise<MilestoneResponse[]> {
		this.logger.log('Fetching all milestones');

		try {
			const milestones = await this.prisma.milestone.findMany({
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${milestones.length} milestones`);
			this.logger.debug('Milestones detail', JSON.stringify(milestones));

			const result: MilestoneResponse[] = milestones.map(mapMilestone);

			return result;
		} catch (error) {
			this.logger.error('Error fetching milestones', error);

			throw error;
		}
	}

	async findBySemester(semesterId: string): Promise<MilestoneResponse[]> {
		this.logger.log(`Fetching milestones for semester ${semesterId}`);

		try {
			const semester = await this.milestoneService.validateSemester(semesterId);

			const milestones = await this.prisma.milestone.findMany({
				where: { semesterId: semester.id },
				orderBy: { startDate: 'asc' },
			});

			this.logger.log(
				`Found ${milestones.length} milestones for semester ${semesterId}`,
			);
			this.logger.debug('Milestones detail', JSON.stringify(milestones));

			const result: MilestoneResponse[] = milestones.map(mapMilestone);

			return result;
		} catch (error) {
			this.logger.error(
				`Error fetching milestones for semester ${semesterId}`,
				error,
			);

			throw error;
		}
	}

	async findOne(id: string): Promise<MilestoneResponse> {
		try {
			this.logger.log(`Fetching milestone with ID: ${id}`);

			const milestone = await this.milestoneService.validateMilestone(id);

			if (!milestone) {
				throw new NotFoundException(`Milestone not found`);
			}

			this.logger.log(`Milestone found with ID: ${id}`);
			this.logger.debug('Milestone detail', JSON.stringify(milestone));

			return milestone;
		} catch (error) {
			this.logger.error(`Error fetching milestone with ID ${id}`, error);
			throw error;
		}
	}
}
