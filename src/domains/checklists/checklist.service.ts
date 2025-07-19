import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CreateChecklistDto, UpdateChecklistDto } from '@/checklists/dto';
import { PrismaService } from '@/providers';

@Injectable()
export class ChecklistService {
	private readonly logger = new Logger(ChecklistService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Validate that milestone operations can be performed (before startDate)
	 */
	private async validateMilestoneOperationTiming(milestoneId: string) {
		try {
			const milestone = await this.prisma.milestone.findUnique({
				where: { id: milestoneId },
			});

			if (!milestone) {
				throw new NotFoundException(`Milestone not found`);
			}

			const now = new Date();
			if (now >= milestone.startDate) {
				throw new ConflictException(
					`Cannot modify checklist. Milestone has already started on ${milestone.startDate.toISOString()}`,
				);
			}

			return milestone;
		} catch (error) {
			this.logger.error(
				`Error validating milestone timing: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}

	async create(createChecklistDto: CreateChecklistDto) {
		try {
			this.logger.log(`Creating new checklist: ${createChecklistDto.name}`);

			// If milestoneId is provided, validate timing
			if (createChecklistDto.milestoneId) {
				await this.validateMilestoneOperationTiming(
					createChecklistDto.milestoneId,
				);
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

	async findAll() {
		try {
			this.logger.log('Fetching all checklists');

			const checklists = await this.prisma.checklist.findMany({
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
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${checklists.length} checklists`);
			return checklists;
		} catch (error) {
			this.logger.error(
				`Error fetching all checklists: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			this.logger.log(`Fetching checklist: ${id}`);

			const checklist = await this.prisma.checklist.findUnique({
				where: { id },
				include: {
					milestone: {
						select: {
							id: true,
							name: true,
							startDate: true,
							endDate: true,
							semester: {
								select: {
									id: true,
									name: true,
									code: true,
								},
							},
						},
					},
					checklistItems: {
						orderBy: { createdAt: 'asc' },
					},
					reviews: {
						include: {
							lecturer: {
								include: {
									user: {
										select: {
											id: true,
											fullName: true,
											email: true,
										},
									},
								},
							},
							submission: {
								include: {
									group: {
										select: {
											id: true,
											code: true,
											name: true,
										},
									},
								},
							},
						},
					},
					_count: {
						select: {
							checklistItems: true,
							reviews: true,
						},
					},
				},
			});

			if (!checklist) {
				throw new NotFoundException(`Checklist with ID ${id} not found`);
			}

			this.logger.log(`Successfully fetched checklist: ${id}`);
			return checklist;
		} catch (error) {
			this.logger.error(
				`Error fetching checklist ${id}: ${error.message}`,
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
				await this.validateMilestoneOperationTiming(
					existingChecklist.milestoneId,
				);
			}

			// If updating to attach to a new milestone, validate that milestone's timing too
			if (
				updateChecklistDto.milestoneId &&
				updateChecklistDto.milestoneId !== existingChecklist.milestoneId
			) {
				await this.validateMilestoneOperationTiming(
					updateChecklistDto.milestoneId,
				);
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
				await this.validateMilestoneOperationTiming(
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

			return {
				message: `Checklist "${existingChecklist.name}" has been successfully deleted`,
				deletedChecklist: {
					id: existingChecklist.id,
					name: existingChecklist.name,
					itemCount: existingChecklist._count.checklistItems,
				},
			};
		} catch (error) {
			this.logger.error(
				`Error deleting checklist ${id}: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}

	/**
	 * Get all checklists for a specific milestone
	 */
	async findByMilestone(milestoneId: string) {
		try {
			this.logger.log(`Fetching checklists for milestone: ${milestoneId}`);

			// Validate milestone exists
			const milestone = await this.prisma.milestone.findUnique({
				where: { id: milestoneId },
			});

			if (!milestone) {
				throw new NotFoundException(`Milestone not found`);
			}

			const checklists = await this.prisma.checklist.findMany({
				where: { milestoneId },
				include: {
					checklistItems: {
						orderBy: { createdAt: 'asc' },
					},
					_count: {
						select: {
							checklistItems: true,
							reviews: true,
						},
					},
				},
				orderBy: { createdAt: 'asc' },
			});

			this.logger.log(
				`Found ${checklists.length} checklists for milestone: ${milestoneId}`,
			);

			return {
				milestone: {
					id: milestone.id,
					name: milestone.name,
					startDate: milestone.startDate,
					endDate: milestone.endDate,
				},
				checklists,
			};
		} catch (error) {
			this.logger.error(
				`Error fetching checklists for milestone ${milestoneId}: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}
}
