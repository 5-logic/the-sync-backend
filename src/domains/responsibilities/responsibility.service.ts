import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class ResponsibilityService {
	private readonly logger = new Logger(ResponsibilityService.name);

	private static readonly CACHE_KEY = 'cache:responsibility';

	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async findAll() {
		try {
			const responsibilities = await this.prisma.responsibility.findMany({
				orderBy: { name: 'asc' },
			});

			this.logger.log(`Found ${responsibilities.length} responsibilities`);

			return responsibilities;
		} catch (error) {
			this.logger.error('Error fetching responsibilities:', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			const responsibility = await this.prisma.responsibility.findUnique({
				where: { id },
			});

			if (!responsibility) {
				throw new NotFoundException(`Responsibility not found`);
			}

			this.logger.log(`Responsibility found with ID: ${responsibility.id}`);

			return responsibility;
		} catch (error) {
			this.logger.error('Error fetching responsibility:', error);
			throw error;
		}
	}
}
