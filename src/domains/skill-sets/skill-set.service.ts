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
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
		private readonly prisma: PrismaService,
	) {}

	async findAll() {
		this.logger.log('Fetching all skill sets');

		try {
			const cached = await this.cache.get(SkillSetService.CACHE_KEY);

			if (cached) {
				return cached;
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

			await this.cache.set(SkillSetService.CACHE_KEY, skillSets, CONSTANTS.TTL);

			this.logger.log(`Found ${skillSets.length} skill sets`);
			this.logger.debug('SkillSets detail:', JSON.stringify(skillSets));

			return skillSets;
		} catch (error) {
			this.logger.error('Error fetching skill sets', error);

			throw error;
		}
	}

	async findOne(id: string) {
		this.logger.log(`Fetching skill set with id: ${id}`);

		try {
			const key = `${SkillSetService.CACHE_KEY}/${id}`;
			const cached = await this.cache.get(key);

			if (cached) {
				return cached;
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
				this.logger.warn(`Skill set with id ${id} not found`);

				throw new NotFoundException(`SkillSet not found`);
			}

			await this.cache.set(key, skillSet, CONSTANTS.TTL);

			this.logger.log(`Found skill set with id ${id}`);
			this.logger.debug('SkillSet detail:', skillSet);

			return skillSet;
		} catch (error) {
			this.logger.error(`Error fetching skill set with id ${id}`, error);

			throw error;
		}
	}
}
