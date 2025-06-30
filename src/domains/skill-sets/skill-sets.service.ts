import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class SkillSetsService {
	private readonly logger = new Logger(SkillSetsService.name);

	constructor(private readonly prisma: PrismaService) {}

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
			this.logger.debug('SkillSets detail:', skillSets);

			return skillSets;
		} catch (error) {
			this.logger.error('Error fetching skill sets', error);
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
				this.logger.warn(`Skill set with id ${id} not found`);
				return null;
			}
			this.logger.log(`Found skill set with id ${id}`);
			this.logger.debug('SkillSet detail:', skillSet);
			return skillSet;
		} catch (error) {
			this.logger.error(`Error fetching skill set with id ${id}`, error);
			throw error;
		}
	}
}
