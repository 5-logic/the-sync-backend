import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class MajorService {
	private readonly logger = new Logger(MajorService.name);

	private static readonly CACHE_KEY = 'cache:major';

	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async findAll() {
		this.logger.log('Fetching all majors');

		try {
			const majors = await this.prisma.major.findMany({
				orderBy: { createdAt: 'desc' },
			});

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
			const major = await this.prisma.major.findUnique({ where: { id } });

			if (!major) {
				this.logger.warn(`Major with id ${id} not found`);

				throw new NotFoundException(`Major not found`);
			}

			this.logger.log(`Major found with id: ${id}`);
			this.logger.debug('Major detail', major);

			return major;
		} catch (error) {
			this.logger.error(`Error fetching major with id ${id}`, error);

			throw error;
		}
	}
}
