import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class ChecklistItemLecturerService {
	private readonly logger = new Logger(ChecklistItemLecturerService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll() {
		try {
			const checklistItems = await this.prisma.checklistItem.findMany({
				orderBy: [{ isRequired: 'desc' }, { createdAt: 'asc' }],
			});

			this.logger.log('Fetched all checklist items');
			this.logger.debug(checklistItems);

			return checklistItems;
		} catch (error) {
			this.logger.error('Failed to fetch checklist items', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			const checklistItem = await this.prisma.checklistItem.findUnique({
				where: { id },
				include: {
					checklist: true,
					reviewItems: {
						include: {
							review: {
								select: {
									id: true,
									feedback: true,
									lecturer: {
										select: {
											user: true,
										},
									},
								},
							},
						},
					},
				},
			});

			this.logger.log(`Fetched checklist item with ID ${id}`);
			this.logger.debug(checklistItem);

			return checklistItem;
		} catch (error) {
			this.logger.error(`Failed to fetch checklist item with ID ${id}`, error);
			throw error;
		}
	}

	async findByChecklistId(checklistId: string) {
		try {
			const checklistItems = await this.prisma.checklistItem.findMany({
				where: { checklistId },
				include: {
					checklist: true,
				},
				orderBy: { createdAt: 'asc' },
			});

			if (!checklistItems.length) {
				throw new NotFoundException(
					`No checklist items found for checklist ID ${checklistId}`,
				);
			}

			this.logger.log(
				`Fetched checklist items for checklist ID ${checklistId}`,
			);
			this.logger.debug(checklistItems);

			return checklistItems;
		} catch (error) {
			this.logger.error(
				`Failed to fetch checklist items for checklist ID ${checklistId}`,
				error,
			);
			throw error;
		}
	}
}
