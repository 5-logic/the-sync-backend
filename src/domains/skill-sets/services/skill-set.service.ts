import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CONSTANTS } from '@/configs';
import { PrismaService } from '@/providers';
import { CACHE_KEY } from '@/skill-sets/constants';
import { SkillReponse, SkillSetReponse } from '@/skill-sets/responses';

@Injectable()
export class SkillSetService {
	private readonly logger = new Logger(SkillSetService.name);

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
	) {}

	async findAll(): Promise<SkillSetReponse[]> {
		this.logger.log('Fetching all skill sets');

		try {
			const cacheKey = `${CACHE_KEY}/`;
			const cache = await this.cache.get<SkillSetReponse[]>(cacheKey);
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

			await this.cache.set(cacheKey, skillSets, CONSTANTS.TTL);

			const result: SkillSetReponse[] = skillSets.map((skillSet) => ({
				id: skillSet.id,
				name: skillSet.name,
				skills: skillSet.skills.map(
					(skill): SkillReponse => ({
						id: skill.id,
						name: skill.name,
						skillSetId: skill.skillSetId,
						createdAt: skill.createdAt.toISOString(),
						updatedAt: skill.updatedAt.toISOString(),
					}),
				),
				createdAt: skillSet.createdAt.toISOString(),
				updatedAt: skillSet.updatedAt.toISOString(),
			}));

			return result;
		} catch (error) {
			this.logger.error('Error fetching skill sets:', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<SkillSetReponse> {
		this.logger.log(`Fetching skill set with id: ${id}`);

		try {
			const cacheKey = `${CACHE_KEY}/${id}`;
			const cache = await this.cache.get<SkillSetReponse>(cacheKey);
			if (cache) {
				this.logger.log(`Returning cached skill set with id: ${id}`);

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
				throw new NotFoundException(`SkillSet not found`);
			}

			this.logger.log(`Skill set found with ID: ${skillSet.id}`);
			this.logger.debug('Skill set detail:', skillSet);

			await this.cache.set(cacheKey, skillSet, CONSTANTS.TTL);

			const result: SkillSetReponse = {
				id: skillSet.id,
				name: skillSet.name,
				skills: skillSet.skills.map(
					(skill): SkillReponse => ({
						id: skill.id,
						name: skill.name,
						skillSetId: skill.skillSetId,
						createdAt: skill.createdAt.toISOString(),
						updatedAt: skill.updatedAt.toISOString(),
					}),
				),
				createdAt: skillSet.createdAt.toISOString(),
				updatedAt: skillSet.updatedAt.toISOString(),
			};

			return result;
		} catch (error) {
			this.logger.error('Error fetching skill set:', error);
			throw error;
		}
	}
}
