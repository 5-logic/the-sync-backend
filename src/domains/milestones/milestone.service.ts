import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';

import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { Milestone } from '~/generated/prisma';

@Injectable()
export class MilestoneService {
	private readonly logger = new Logger(MilestoneService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createMilestoneDto: CreateMilestoneDto): Promise<Milestone> {
		try {
			const newMilestone = await this.prisma.milestone.create({
				data: createMilestoneDto,
			});

			this.logger.log(`Milestone created with ID: ${newMilestone.id}`);
			this.logger.debug(`Milestone`, newMilestone);

			return newMilestone;
		} catch (error) {
			this.logger.error('Error creating milestone', error);
			throw error;
		}
	}

	async findAll(): Promise<Milestone[]> {
		try {
			const milestones = await this.prisma.milestone.findMany();

			this.logger.log(`Found ${milestones.length} milestones`);

			return milestones;
		} catch (error) {
			this.logger.error('Error fetching milestones', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<Milestone | null> {
		try {
			const milestone = await this.prisma.milestone.findUnique({
				where: { id },
			});

			if (!milestone) {
				this.logger.warn(`Milestone with ID ${id} not found`);
				return null;
			}

			this.logger.log(`Milestone found with ID: ${milestone.id}`);
			return milestone;
		} catch (error) {
			this.logger.error('Error fetching milestone', error);
			throw error;
		}
	}

	async update(
		id: string,
		updateMilestoneDto: UpdateMilestoneDto,
	): Promise<Milestone> {
		try {
			const updatedMilestone = await this.prisma.milestone.update({
				where: { id },
				data: updateMilestoneDto,
			});

			this.logger.log(`Milestone updated with ID: ${updatedMilestone.id}`);
			this.logger.debug(`Updated Milestone`, updatedMilestone);

			return updatedMilestone;
		} catch (error) {
			this.logger.error('Error updating milestone', error);
			throw error;
		}
	}

	async remove(id: string): Promise<Milestone> {
		try {
			const deletedMilestone = await this.prisma.milestone.delete({
				where: { id },
			});

			this.logger.log(`Milestone deleted with ID: ${deletedMilestone.id}`);
			return deletedMilestone;
		} catch (error) {
			this.logger.error('Error deleting milestone', error);
			throw error;
		}
	}
}
