import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CONSTANTS } from '@/configs';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class ResponsibilityService {
	private readonly logger = new Logger(ResponsibilityService.name);
	private static readonly CACHE_KEY = 'cache:/responsibilities';

	constructor(
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
		private readonly prisma: PrismaService,
	) {}

	async findAll() {
		this.logger.log('Fetching all responsibilities');

		try {
			const cached = await this.cache.get(ResponsibilityService.CACHE_KEY);

			if (cached) {
				return cached;
			}

			const responsibilities = await this.prisma.responsibility.findMany({
				orderBy: { name: 'asc' },
			});

			await this.cache.set(
				ResponsibilityService.CACHE_KEY,
				responsibilities,
				CONSTANTS.TTL,
			);

			this.logger.log(`Fetched ${responsibilities.length} responsibilities`);
			this.logger.debug('Responsibilities:', responsibilities);

			return responsibilities;
		} catch (error) {
			this.logger.error('Error fetching responsibilities', error);

			throw error;
		}
	}

	async findOne(id: string) {
		this.logger.log(`Fetching responsibility with ID: ${id}`);

		try {
			const cached = await this.cache.get(
				`${ResponsibilityService.CACHE_KEY}:${id}`,
			);

			if (cached) {
				return cached;
			}

			const responsibility = await this.prisma.responsibility.findUnique({
				where: { id },
			});

			if (!responsibility) {
				this.logger.warn(`Responsibility with ID ${id} not found`);

				throw new NotFoundException(`Responsibility not found`);
			}

			await this.cache.set(
				`${ResponsibilityService.CACHE_KEY}:${id}`,
				responsibility,
				CONSTANTS.TTL,
			);

			return responsibility;
		} catch (error) {
			this.logger.error('Error fetching responsibility', error);
			throw error;
		}
	}
}
