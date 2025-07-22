import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { mapMilestone } from '@/milestones/mappers';
import { MilestoneResponse } from '@/milestones/responses';
import { MilestoneService } from '@/milestones/services';
import { PrismaService } from '@/providers';

@Injectable()
export class MilestonePublicService {
	private readonly logger = new Logger(MilestonePublicService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly milestoneService: MilestoneService,
	) {}

	async findAll(): Promise<MilestoneResponse[]> {
		try {
			this.logger.log('Fetching all milestones');

			const milestones = await this.prisma.milestone.findMany({
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${milestones.length} milestones`);
			this.logger.debug('Milestones detail', milestones);

			return milestones.map(mapMilestone);
		} catch (error) {
			this.logger.error('Error fetching milestones', error);

			throw error;
		}
	}

	async findBySemester(semesterId: string): Promise<MilestoneResponse[]> {
		try {
			this.logger.log(`Fetching milestones for semester ${semesterId}`);

			const semester = await this.milestoneService.validateSemester(semesterId);

			const milestones = await this.prisma.milestone.findMany({
				where: { semesterId: semester.id },
				orderBy: { startDate: 'asc' },
			});

			if (milestones.length === 0) {
				this.logger.warn(`No milestones found for semester ${semesterId}`);
			} else {
				this.logger.log(
					`Found ${milestones.length} milestones for semester ${semesterId}`,
				);
			}

			return milestones.map(mapMilestone);
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
			this.logger.debug('Milestone detail', milestone);

			return milestone;
		} catch (error) {
			this.logger.error(`Error fetching milestone with ID ${id}`, error);
			throw error;
		}
	}
}
