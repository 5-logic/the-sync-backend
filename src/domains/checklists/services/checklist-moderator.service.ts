import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CreateChecklistDto, UpdateChecklistDto } from '@/checklists/dtos';
import { ChecklistService } from '@/checklists/services/checklist.service';
import { PrismaService } from '@/providers';

@Injectable()
export class ChecklistModeratorService {
	private readonly logger = new Logger(ChecklistModeratorService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly checklistService: ChecklistService,
	) {}

	async create(createChecklistDto: CreateChecklistDto) {
		try {
			this.logger.log(`Creating new checklist: ${createChecklistDto.name}`);

			// If milestoneId is provided, validate timing
			if (createChecklistDto.milestoneId) {
				await this.checklistService.validateMilestoneOperationTiming(
					createChecklistDto.milestoneId,
				);
				// Ensure only one checklist per milestone
				const existingChecklist = await this.prisma.checklist.findFirst({
					where: { milestoneId: createChecklistDto.milestoneId },
				});
				if (existingChecklist) {
					this.logger.warn(
						`Milestone already has a checklist (ID: ${existingChecklist.id}). Only one checklist is allowed per milestone.`,
					);
					throw new ConflictException(
						`Milestone already has a checklist  ${existingChecklist.name}. Only one checklist is allowed per milestone.`,
					);
				}
			}

			const checklist = await this.prisma.checklist.create({
				data: {
					name: createChecklistDto.name,
					description: createChecklistDto.description,
					milestoneId: createChecklistDto.milestoneId,
				},
				include: {
					milestone: {
						select: {
							id: true,
							name: true,
							startDate: true,
							endDate: true,
						},
					},
					checklistItems: true,
					_count: {
						select: {
							checklistItems: true,
							reviews: true,
						},
					},
				},
			});

			this.logger.log(`Successfully created checklist: ${checklist.id}`);
			return checklist;
		} catch (error) {
			this.logger.error(
				`Error creating checklist: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}

	async update(id: string, updateChecklistDto: UpdateChecklistDto) {
		try {
			this.logger.log(`Updating checklist: ${id}`);

			// Check if checklist exists
			const existingChecklist = await this.prisma.checklist.findUnique({
				where: { id },
				include: {
					milestone: true,
				},
			});

			if (!existingChecklist) {
				throw new NotFoundException(`Checklist with ID ${id} not found`);
			}

			// If checklist is currently attached to a milestone, validate timing
			if (existingChecklist.milestoneId) {
				await this.checklistService.validateMilestoneOperationTiming(
					existingChecklist.milestoneId,
				);
			}

			// If updating to attach to a new milestone, validate that milestone's timing too
			if (
				updateChecklistDto.milestoneId &&
				updateChecklistDto.milestoneId !== existingChecklist.milestoneId
			) {
				await this.checklistService.validateMilestoneOperationTiming(
					updateChecklistDto.milestoneId,
				);
				// Ensure only one checklist per milestone
				const checklistOnMilestone = await this.prisma.checklist.findFirst({
					where: {
						milestoneId: updateChecklistDto.milestoneId,
						NOT: { id },
					},
				});
				if (checklistOnMilestone) {
					this.logger.warn(
						`Milestone already has a checklist (ID: ${checklistOnMilestone.id}). Only one checklist is allowed per milestone.`,
					);
					throw new ConflictException(
						`Milestone already has a checklist ${checklistOnMilestone.name}. Only one checklist is allowed per milestone.`,
					);
				}
			}

			const updatedChecklist = await this.prisma.checklist.update({
				where: { id },
				data: {
					name: updateChecklistDto.name,
					description: updateChecklistDto.description,
					milestoneId: updateChecklistDto.milestoneId,
				},
				include: {
					milestone: {
						select: {
							id: true,
							name: true,
							startDate: true,
							endDate: true,
						},
					},
					checklistItems: true,
					_count: {
						select: {
							checklistItems: true,
							reviews: true,
						},
					},
				},
			});

			this.logger.log(`Successfully updated checklist: ${id}`);
			return updatedChecklist;
		} catch (error) {
			this.logger.error(
				`Error updating checklist ${id}: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}

	async remove(id: string) {
		try {
			this.logger.log(`Deleting checklist: ${id}`);

			// Check if checklist exists and get milestone info
			const existingChecklist = await this.prisma.checklist.findUnique({
				where: { id },
				include: {
					milestone: true,
					_count: {
						select: {
							reviews: true,
							checklistItems: true,
						},
					},
				},
			});

			if (!existingChecklist) {
				throw new NotFoundException(`Checklist with ID ${id} not found`);
			}

			// If checklist is attached to a milestone, validate timing
			if (existingChecklist.milestoneId) {
				await this.checklistService.validateMilestoneOperationTiming(
					existingChecklist.milestoneId,
				);
			}

			// Check if checklist has been used in reviews
			if (existingChecklist._count.reviews > 0) {
				throw new ConflictException(
					`Cannot delete checklist. It has been used in ${existingChecklist._count.reviews} review(s)`,
				);
			}

			// Delete the checklist (cascade will handle checklist items)
			await this.prisma.checklist.delete({
				where: { id },
			});

			this.logger.log(`Successfully deleted checklist: ${id}`);

			return;
		} catch (error) {
			this.logger.error(
				`Error deleting checklist ${id}: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}
}
