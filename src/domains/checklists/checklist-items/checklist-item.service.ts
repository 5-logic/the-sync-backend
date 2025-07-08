import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';

import {
	CreateManyChecklistItemsDto,
	UpdateManyChecklistItemsDto,
} from '@/checklists/checklist-items/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class ChecklistItemService {
	constructor(private readonly prisma: PrismaService) {}

	async createMany(createManyChecklistItemsDto: CreateManyChecklistItemsDto) {
		try {
			const { checklistId, checklistItems } = createManyChecklistItemsDto;

			// Verify checklist exists
			const checklist = await this.prisma.checklist.findUnique({
				where: { id: checklistId },
				select: { id: true, name: true }, // Only select needed fields
			});

			if (!checklist) {
				throw new NotFoundException(
					`Checklist with ID ${checklistId} not found`,
				);
			}

			// Prepare data for bulk insert
			const dataToInsert = checklistItems.map((itemDto) => ({
				...itemDto,
				checklistId,
			}));

			// Use createMany for better performance
			const createResult = await this.prisma.checklistItem.createMany({
				data: dataToInsert,
				skipDuplicates: false, // Set to true if you want to skip duplicates
			});

			// If you need to return the created items with relations, fetch them
			// This is optional - remove if you don't need the full data
			const createdItems = await this.prisma.checklistItem.findMany({
				where: {
					checklistId,
					createdAt: {
						gte: new Date(Date.now() - 5000), // Items created in last 5 seconds
					},
				},
				include: {
					checklist: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
				take: createResult.count,
			});

			return {
				count: createResult.count,
				items: createdItems,
			};
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException('Failed to create checklist items');
		}
	}

	/**
	 * Optimized version of createMany that only returns count (better performance)
	 * Use this when you don't need the full created items data
	 */
	async createManyOptimized(
		createManyChecklistItemsDto: CreateManyChecklistItemsDto,
	) {
		try {
			const { checklistId, checklistItems } = createManyChecklistItemsDto;

			// Verify checklist exists with minimal data selection
			const checklistExists = await this.prisma.checklist.findUnique({
				where: { id: checklistId },
				select: { id: true }, // Only select id to minimize data transfer
			});

			if (!checklistExists) {
				throw new NotFoundException(
					`Checklist with ID ${checklistId} not found`,
				);
			}

			// Prepare data for bulk insert
			const dataToInsert = checklistItems.map((itemDto) => ({
				...itemDto,
				checklistId,
			}));

			// Use createMany for optimal performance - no relations fetched
			const result = await this.prisma.checklistItem.createMany({
				data: dataToInsert,
				skipDuplicates: false,
			});

			return {
				count: result.count,
				message: `Successfully created ${result.count} checklist items`,
			};
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException('Failed to create checklist items');
		}
	}

	async findAll(checklistId?: string) {
		const where = checklistId ? { checklistId } : {};

		return this.prisma.checklistItem.findMany({
			where,
			include: {
				checklist: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	}

	async findOne(id: string) {
		const checklistItem = await this.prisma.checklistItem.findUnique({
			where: { id },
			include: {
				checklist: {
					select: {
						id: true,
						name: true,
					},
				},
				reviewItems: {
					include: {
						review: {
							select: {
								id: true,
								feedback: true,
								lecturer: {
									select: {
										userId: true,
										user: {
											select: {
												fullName: true,
												email: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		});

		if (!checklistItem) {
			throw new NotFoundException(`Checklist item with ID ${id} not found`);
		}

		return checklistItem;
	}

	async remove(id: string) {
		try {
			const checklistItem = await this.prisma.checklistItem.findUnique({
				where: { id },
			});

			if (!checklistItem) {
				throw new NotFoundException(`Checklist item with ID ${id} not found`);
			}

			await this.prisma.checklistItem.delete({
				where: { id },
			});

			return { message: 'Checklist item deleted successfully' };
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException('Failed to delete checklist item');
		}
	}

	async findByChecklistId(checklistId: string) {
		// Verify checklist exists
		const checklist = await this.prisma.checklist.findUnique({
			where: { id: checklistId },
		});

		if (!checklist) {
			throw new NotFoundException(`Checklist with ID ${checklistId} not found`);
		}

		return this.prisma.checklistItem.findMany({
			where: { checklistId },
			orderBy: [{ isRequired: 'desc' }, { createdAt: 'asc' }],
		});
	}

	async updateMany(
		checklistId: string,
		updateManyChecklistItemsDto: UpdateManyChecklistItemsDto,
	) {
		try {
			const { items } = updateManyChecklistItemsDto;

			// Verify checklist exists and get item IDs in one query
			const itemIds = items.map((item) => item.id);

			// Combined validation: check checklist existence and verify all items exist and belong to checklist
			const [checklist, existingItems] = await Promise.all([
				this.prisma.checklist.findUnique({
					where: { id: checklistId },
					select: { id: true },
				}),
				this.prisma.checklistItem.findMany({
					where: {
						id: { in: itemIds },
						checklistId,
					},
					select: { id: true },
				}),
			]);

			if (!checklist) {
				throw new NotFoundException(
					`Checklist with ID ${checklistId} not found`,
				);
			}

			if (existingItems.length !== itemIds.length) {
				const foundIds = existingItems.map((item) => item.id);
				const notFoundIds = itemIds.filter((id) => !foundIds.includes(id));
				throw new NotFoundException(
					`Checklist item(s) with ID(s) ${notFoundIds.join(
						', ',
					)} not found or do not belong to checklist ${checklistId}`,
				);
			}

			// Use Promise.all for parallel updates instead of sequential transaction
			const updatePromises = items.map((itemDto) => {
				const { id, ...updateData } = itemDto;
				return this.prisma.checklistItem.update({
					where: { id },
					data: updateData,
					include: {
						checklist: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				});
			});

			const updatedItems = await Promise.all(updatePromises);

			return updatedItems;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException('Failed to update checklist items');
		}
	}
}
