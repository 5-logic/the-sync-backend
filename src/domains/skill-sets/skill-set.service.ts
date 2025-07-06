import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CONSTANTS } from '@/configs';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class SkillSetService {
	private readonly logger = new Logger(SkillSetService.name);
	private static readonly CACHE_KEY = 'cache:/skill-sets';

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
			const cacheKey = `${SkillSetService.CACHE_KEY}:all`;
			const cachedSkillSets = await this.getCachedData<any[]>(cacheKey);
			if (cachedSkillSets) {
				this.logger.log(
					`Found ${cachedSkillSets.length} skill sets (from cache)`,
				);
				return cachedSkillSets;
			}

			const skillSets = await this.prisma.skillSet.findMany({
				include: {
					skills: {
						orderBy: {
							name: 'asc',
						},
					},
				},
				orderBy: {
					name: 'asc',
				},
			});

			await this.setCachedData(cacheKey, skillSets);

			this.logger.log(`Found ${skillSets.length} skill sets`);

			return skillSets;
		} catch (error) {
			this.logger.error('Error fetching skill sets:', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			const cacheKey = `${SkillSetService.CACHE_KEY}:${id}`;
			const cachedSkillSet = await this.getCachedData<any>(cacheKey);
			if (cachedSkillSet) {
				this.logger.log(
					`Skill set found with ID: ${cachedSkillSet.id} (from cache)`,
				);
				return cachedSkillSet;
			}

			const skillSet = await this.prisma.skillSet.findUnique({
				where: { id },
				include: {
					skills: {
						orderBy: {
							name: 'asc',
						},
					},
				},
			});

			if (!skillSet) {
				throw new NotFoundException(`SkillSet not found`);
			}

			await this.setCachedData(cacheKey, skillSet);

			this.logger.log(`Skill set found with ID: ${skillSet.id}`);

			return skillSet;
		} catch (error) {
			this.logger.error('Error fetching skill set:', error);
			throw error;
		}
	}
}
