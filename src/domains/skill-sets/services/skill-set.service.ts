import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CacheHelperService, PrismaService } from '@/providers';
import { CACHE_KEY } from '@/skill-sets/constants';
import { mapSkillSet } from '@/skill-sets/mappers';
import { SkillSetReponse } from '@/skill-sets/responses';

@Injectable()
export class SkillSetService {
	private readonly logger = new Logger(SkillSetService.name);

	constructor(
		private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
	) {}

	async findAll(): Promise<SkillSetReponse[]> {
		this.logger.log('Fetching all skill sets');

		try {
			const cacheKey = `${CACHE_KEY}/`;
			const cache = await this.cache.getFromCache<SkillSetReponse[]>(cacheKey);
			if (cache) {
				this.logger.log('Returning cached skill sets');

				return cache;
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

			this.logger.log(`Found ${skillSets.length} skill sets`);
			this.logger.debug('Skill sets:', JSON.stringify(skillSets));

			const result: SkillSetReponse[] = skillSets.map(mapSkillSet);

			await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error('Error fetching skill sets', error);

			throw error;
		}
	}

	async findOne(id: string): Promise<SkillSetReponse> {
		this.logger.log(`Fetching skill set with ID: ${id}`);

		try {
			const cacheKey = `${CACHE_KEY}/${id}`;
			const cache = await this.cache.getFromCache<SkillSetReponse>(cacheKey);
			if (cache) {
				this.logger.log(`Returning cached skill set with ID: ${id}`);

				return cache;
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
				this.logger.warn(`Skill set with ID ${id} not found`);

				throw new NotFoundException(`SkillSet not found`);
			}

			this.logger.log(`Skill set found with ID: ${skillSet.id}`);
			this.logger.debug('Skill set detail:', JSON.stringify(skillSet));

			const result: SkillSetReponse = mapSkillSet(skillSet);

			await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error(`Error fetching skill set with ID ${id}`, error);

			throw error;
		}
	}
}
