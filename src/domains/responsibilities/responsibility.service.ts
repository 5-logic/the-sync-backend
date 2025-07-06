import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CONSTANTS } from '@/configs';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class ResponsibilityService {
	private readonly logger = new Logger(ResponsibilityService.name);
	private static readonly CACHE_KEY = 'cache:responsibility';

	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly prisma: PrismaService,
	) {}

	private async getCachedData<T>(key: string): Promise<T | null> {
		try {
			const result = await this.cacheManager.get<T>(key);
			return result ?? null;
		} catch (error) {
			this.logger.warn(`Cache get error for key ${key}:`, error);
			return null;
		}
	}

	private async setCachedData(
		key: string,
		data: any,
		ttl?: number,
	): Promise<void> {
		try {
			await this.cacheManager.set(key, data, ttl ?? CONSTANTS.TTL);
		} catch (error) {
			this.logger.warn(`Cache set error for key ${key}:`, error);
		}
	}

	async findAll() {
		try {
			const cacheKey = `${ResponsibilityService.CACHE_KEY}:all`;
			const cachedResponsibilities = await this.getCachedData<any[]>(cacheKey);
			if (cachedResponsibilities) {
				this.logger.log(
					`Found ${cachedResponsibilities.length} responsibilities (from cache)`,
				);
				return cachedResponsibilities;
			}

			const responsibilities = await this.prisma.responsibility.findMany({
				orderBy: { name: 'asc' },
			});

			await this.setCachedData(cacheKey, responsibilities);

			this.logger.log(`Found ${responsibilities.length} responsibilities`);

			return responsibilities;
		} catch (error) {
			this.logger.error('Error fetching responsibilities:', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			const cacheKey = `${ResponsibilityService.CACHE_KEY}:${id}`;
			const cachedResponsibility = await this.getCachedData<any>(cacheKey);
			if (cachedResponsibility) {
				this.logger.log(
					`Responsibility found with ID: ${cachedResponsibility.id} (from cache)`,
				);
				return cachedResponsibility;
			}

			const responsibility = await this.prisma.responsibility.findUnique({
				where: { id },
			});

			if (!responsibility) {
				throw new NotFoundException(`Responsibility not found`);
			}

			await this.setCachedData(cacheKey, responsibility);

			this.logger.log(`Responsibility found with ID: ${responsibility.id}`);

			return responsibility;
		} catch (error) {
			this.logger.error('Error fetching responsibility:', error);
			throw error;
		}
	}
}
