import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';

import {
	CreateChecklistItemDto,
	CreateManyChecklistItemsDto,
	UpdateChecklistItemDto,
} from '@/checklists/checklist-items/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class ChecklistItemService {
	constructor(private readonly prisma: PrismaService) {}

	async create(createChecklistItemDto: CreateChecklistItemDto) {
		try {
			// Verify checklist exists
			const checklist = await this.prisma.checklist.findUnique({
				where: { id: createChecklistItemDto.checklistId },
			});

			if (!checklist) {
				throw new NotFoundException(
					`Checklist with ID ${createChecklistItemDto.checklistId} not found`,
				);
			}

			const checklistItem = await this.prisma.checklistItem.create({
				data: createChecklistItemDto,
				include: {
					checklist: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			return checklistItem;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException('Failed to create checklist item');
		}
	}

	async createMany(createManyChecklistItemsDto: CreateManyChecklistItemsDto) {
		try {
			// Get all unique checklist IDs from the items
			const checklistIds = [
				...new Set(
					createManyChecklistItemsDto.items.map((item) => item.checklistId),
				),
			];

			// Verify all checklists exist
			const checklists = await this.prisma.checklist.findMany({
				where: { id: { in: checklistIds } },
			});

			if (checklists.length !== checklistIds.length) {
				const foundIds = checklists.map((c) => c.id);
				const notFoundIds = checklistIds.filter((id) => !foundIds.includes(id));
				throw new NotFoundException(
					`Checklist(s) with ID(s) ${notFoundIds.join(', ')} not found`,
				);
			}

			// Create all checklist items using transaction
			const result = await this.prisma.$transaction(async (tx) => {
				const createdItems: any[] = [];
				for (const itemDto of createManyChecklistItemsDto.items) {
					const checklistItem = await tx.checklistItem.create({
						data: itemDto,
						include: {
							checklist: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					});
					createdItems.push(checklistItem);
				}
				return createdItems;
			});

			return result;
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

	async update(id: string, updateChecklistItemDto: UpdateChecklistItemDto) {
		try {
			// Check if checklist item exists
			const existingItem = await this.prisma.checklistItem.findUnique({
				where: { id },
			});

			if (!existingItem) {
				throw new NotFoundException(`Checklist item with ID ${id} not found`);
			}

			// If checklistId is being updated, verify new checklist exists
			if (updateChecklistItemDto.checklistId) {
				const checklist = await this.prisma.checklist.findUnique({
					where: { id: updateChecklistItemDto.checklistId },
				});

				if (!checklist) {
					throw new NotFoundException(
						`Checklist with ID ${updateChecklistItemDto.checklistId} not found`,
					);
				}
			}

			const updatedChecklistItem = await this.prisma.checklistItem.update({
				where: { id },
				data: updateChecklistItemDto,
				include: {
					checklist: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			return updatedChecklistItem;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException('Failed to update checklist item');
		}
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
}
