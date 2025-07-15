import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CONSTANTS } from '@/configs';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { CACHE_KEY } from '@/responsibilities/constants';

@Injectable()
export class ResponsibilityService {
	private readonly logger = new Logger(ResponsibilityService.name);

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
	) {}

	async findAll() {
		this.logger.log('Fetching all responsibilities');

		try {
			const cacheKey = `${CACHE_KEY}/`;
			const cache = await this.cache.get(cacheKey);
			if (cache) {
				this.logger.log('Returning cached responsibilities');

				return cache;
			}

			const responsibilities = await this.prisma.responsibility.findMany({
				orderBy: { name: 'asc' },
			});

			this.logger.log(`Found ${responsibilities.length} responsibilities`);

			await this.cache.set(cacheKey, responsibilities, CONSTANTS.TTL);

			return responsibilities;
		} catch (error) {
			this.logger.error('Error fetching responsibilities:', error);

			throw error;
		}
	}

	async findOne(id: string) {
		this.logger.log(`Fetching responsibility with ID: ${id}`);

		try {
			const cacheKey = `${CACHE_KEY}/${id}`;
			const cache = await this.cache.get(cacheKey);
			if (cache) {
				this.logger.log(`Returning cached responsibility with ID: ${id}`);

				return cache;
			}

			const responsibility = await this.prisma.responsibility.findUnique({
				where: { id },
			});

			if (!responsibility) {
				throw new NotFoundException(`Responsibility not found`);
			}

			this.logger.log(`Responsibility found with ID: ${responsibility.id}`);

			await this.cache.set(cacheKey, responsibility, CONSTANTS.TTL);

			return responsibility;
		} catch (error) {
			this.logger.error('Error fetching responsibility:', error);

			throw error;
		}
	}
}
