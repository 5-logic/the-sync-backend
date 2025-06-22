import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class MajorService {
	private readonly logger = new Logger(MajorService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll() {
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
		try {
			this.logger.log(`Fetching major with id: ${id}`);

			const major = await this.prisma.major.findUnique({ where: { id } });

			if (!major) {
				this.logger.warn(`Major with id ${id} not found`);

				throw new NotFoundException(`Major with id ${id} not found`);
			}

			this.logger.log(`Major found with id: ${id}`);
			this.logger.debug('Major detail', major);

			return major;
		} catch (error) {
			this.logger.error('Error fetching major', error);

			throw error;
		}
	}
}
