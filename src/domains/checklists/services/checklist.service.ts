import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class ChecklistService {
	private readonly logger = new Logger(ChecklistService.name);

	constructor(private readonly prisma: PrismaService) {}

	async validateMilestoneOperationTiming(milestoneId: string) {
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
}
