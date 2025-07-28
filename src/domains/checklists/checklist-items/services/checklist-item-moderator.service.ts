import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
	CreateManyChecklistItemsDto,
	UpdateManyChecklistItemsDto,
} from '@/checklists/checklist-items/dtos';
import { PrismaService } from '@/providers';

@Injectable()
export class ChecklistItemModeratorService {
	private readonly logger = new Logger(ChecklistItemModeratorService.name);

	constructor(private readonly prisma: PrismaService) {}

	async createMany(createManyChecklistItemsDto: CreateManyChecklistItemsDto) {
		try {
			const { checklistId, checklistItems } = createManyChecklistItemsDto;

			const checklist = await this.prisma.checklist.findUnique({
				where: { id: checklistId },
				select: { id: true, name: true },
			});

			if (!checklist) {
				this.logger.error(
					`Checklist with ID ${checklistId} not found during createMany operation`,
				);
				throw new NotFoundException(`Checklist not found`);
			}

			const dataToInsert = checklistItems.map((itemDto) => ({
				...itemDto,
				checklistId,
			}));

			const result = await this.prisma.$transaction(async (tx) => {
				return await tx.checklistItem.createMany({
					data: dataToInsert,
					skipDuplicates: false,
				});
			});

			this.logger.log(
				`Successfully created ${result.count} checklist items for checklist ID ${checklistId}`,
			);
			this.logger.debug(`Created items: ${JSON.stringify(dataToInsert)}`);

			return result;
		} catch (error) {
			this.logger.error(
				`Error creating checklist items for checklist ID ${createManyChecklistItemsDto.checklistId}: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}

	async updateMany(
		checklistId: string,
		updateManyChecklistItemsDto: UpdateManyChecklistItemsDto,
	) {
		try {
			const { items } = updateManyChecklistItemsDto;

			const itemIds = items.map((item) => item.id);

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
				this.logger.error(
					`Checklist with ID ${checklistId} not found during updateMany operation`,
				);
				throw new NotFoundException(`Checklist with  not found`);
			}

			if (existingItems.length !== itemIds.length) {
				const foundIds = existingItems.map((item) => item.id);
				const notFoundIds = itemIds.filter((id) => !foundIds.includes(id));

				this.logger.error(
					`Checklist item(s) with ID(s) ${notFoundIds.join(
						', ',
					)} not found or do not belong to checklist ${checklistId}`,
				);
				throw new NotFoundException(
					`Checklist item(s) not found or do not belong to checklist`,
				);
			}

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
			this.logger.error(
				`Error updating checklist items for checklist ID ${checklistId}: ${error.message}`,
				error.stack,
			);
			throw error;
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

			return;
		} catch (error) {
			this.logger.error(
				`Error deleting checklist item with ID ${id}: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}
}
