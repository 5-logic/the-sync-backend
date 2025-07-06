import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { BaseCacheService } from '@/bases/base-cache.service';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class MajorService extends BaseCacheService {
	private static readonly CACHE_KEY = 'cache:major';

	constructor(
		@Inject(CACHE_MANAGER) cacheManager: Cache,
		private readonly prisma: PrismaService,
	) {
		super(cacheManager, MajorService.name);
	}

	async findAll() {
		this.logger.log('Fetching all majors');

		try {
			const cacheKey = `${MajorService.CACHE_KEY}:all`;
			const cachedMajors = await this.getCachedData<any[]>(cacheKey);

			if (cachedMajors) {
				this.logger.log(`Found ${cachedMajors.length} majors (from cache)`);
				return cachedMajors;
			}

			const majors = await this.prisma.major.findMany({
				orderBy: { createdAt: 'desc' },
			});

			await this.setCachedData(cacheKey, majors);

			this.logger.log(`Fetched ${majors.length} majors`);
			this.logger.debug('Majors:', majors);

			return majors;
		} catch (error) {
			this.logger.error('Error fetching majors', error);

			throw error;
		}
	}

	async findOne(id: string) {
		this.logger.log(`Fetching major with id: ${id}`);

		try {
			const cacheKey = `${MajorService.CACHE_KEY}:${id}`;
			const cachedMajor = await this.getCachedData<any>(cacheKey);

			if (cachedMajor) {
				this.logger.log(`Major found with id: ${id} (from cache)`);
				return cachedMajor;
			}

			const major = await this.prisma.major.findUnique({ where: { id } });

			if (!major) {
				this.logger.warn(`Major with id ${id} not found`);

				throw new NotFoundException(`Major not found`);
			}

			await this.setCachedData(cacheKey, major);

			this.logger.log(`Major found with id: ${id}`);
			this.logger.debug('Major detail', major);

			return major;
		} catch (error) {
			this.logger.error(`Error fetching major with id ${id}`, error);

			throw error;
		}
	}
}
