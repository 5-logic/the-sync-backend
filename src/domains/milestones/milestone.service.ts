import { Injectable, Logger } from '@nestjs/common';

import { CreateMilestoneDto } from '@/milestones/dto/create-milestone.dto';
import { UpdateMilestoneDto } from '@/milestones/dto/update-milestone.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class MilestoneService {
	private readonly logger = new Logger(MilestoneService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createMilestoneDto: CreateMilestoneDto): Promise<any> {
		try {
			const newMilestone = await this.prisma.milestone.create({
				data: createMilestoneDto,
				include: { trackingDetails: { select: { id: true } } },
			});

			this.logger.log(`Milestone created with ID: ${newMilestone.id}`);
			this.logger.debug(`Milestone`, newMilestone);

			return {
				...newMilestone,
				trackingDetails: newMilestone.trackingDetails?.map((td) => td.id) ?? [],
			};
		} catch (error) {
			this.logger.error('Error creating milestone', error);

			throw error;
		}
	}

	async findAll(): Promise<any[]> {
		try {
			const milestones = await this.prisma.milestone.findMany({
				include: { trackingDetails: { select: { id: true } } },
			});

			this.logger.log(`Found ${milestones.length} milestones`);

			return milestones.map((m) => ({
				...m,
				trackingDetails: m.trackingDetails?.map((td) => td.id) ?? [],
			}));
		} catch (error) {
			this.logger.error('Error fetching milestones', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<any> {
		try {
			const milestone = await this.prisma.milestone.findUnique({
				where: { id },
				include: { trackingDetails: { select: { id: true } } },
			});

			if (!milestone) {
				this.logger.warn(`Milestone with ID ${id} not found`);
				return null;
			}

			this.logger.log(`Milestone found with ID: ${milestone.id}`);
			return {
				...milestone,
				trackingDetails: milestone.trackingDetails?.map((td) => td.id) ?? [],
			};
		} catch (error) {
			this.logger.error('Error fetching milestone', error);
			throw error;
		}
	}

	async update(
		id: string,
		updateMilestoneDto: UpdateMilestoneDto,
	): Promise<any> {
		try {
			const updatedMilestone = await this.prisma.milestone.update({
				where: { id },
				data: updateMilestoneDto,
				include: { trackingDetails: { select: { id: true } } },
			});

			this.logger.log(`Milestone updated with ID: ${updatedMilestone.id}`);
			this.logger.debug(`Updated Milestone`, updatedMilestone);

			return {
				...updatedMilestone,
				trackingDetails:
					updatedMilestone.trackingDetails?.map((td) => td.id) ?? [],
			};
		} catch (error) {
			this.logger.error('Error updating milestone', error);
			throw error;
		}
	}

	async remove(id: string): Promise<any> {
		try {
			const deletedMilestone = await this.prisma.milestone.delete({
				where: { id },
			});

			this.logger.log(`Milestone deleted with ID: ${deletedMilestone.id}`);
			return {
				status: 'success',
				message: `Milestone with ID ${deletedMilestone.id} deleted successfully`,
			};
		} catch (error) {
			this.logger.error('Error deleting milestone', error);
			throw error;
		}
	}
}
