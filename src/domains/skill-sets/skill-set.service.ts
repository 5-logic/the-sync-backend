import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class SkillSetService {
	private readonly logger = new Logger(SkillSetService.name);

	private static readonly CACHE_KEY = 'cache:skill-set';

	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async findAll() {
		try {
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

			return skillSets;
		} catch (error) {
			this.logger.error('Error fetching skill sets:', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
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

			return skillSet;
		} catch (error) {
			this.logger.error('Error fetching skill set:', error);
			throw error;
		}
	}
}
