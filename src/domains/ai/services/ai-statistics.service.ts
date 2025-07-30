import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';

import { AIAPIType } from '~/generated/prisma';

@Injectable()
export class AIStatisticsService {
	private readonly logger = new Logger(AIStatisticsService.name);

	constructor(private readonly prisma: PrismaService) {}

	async logAIAPICall(
		userId: string,
		semesterId: string,
		type: AIAPIType,
	): Promise<void> {
		try {
			await this.prisma.statisticAI.create({
				data: {
					userId,
					semesterId,
					type,
				},
			});

			this.logger.debug(
				`AI API call logged: ${type} by user ${userId} in semester ${semesterId}`,
			);
		} catch (error) {
			this.logger.error('Failed to log AI API call:', error);
		}
	}
}
