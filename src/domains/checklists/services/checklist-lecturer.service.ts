import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class ChecklistLecturerService {
	private readonly logger = new Logger(ChecklistLecturerService.name);

	constructor(private readonly prisma: PrismaService) {}

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
