import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CONSTANTS } from '@/configs';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class MajorService {
	private readonly logger = new Logger(MajorService.name);
	private static readonly CACHE_KEY = 'cache:/majors';

	constructor(
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
		private readonly prisma: PrismaService,
	) {}

	async findAll() {
		this.logger.log('Fetching all majors');

		try {
			const cached = await this.cache.get(MajorService.CACHE_KEY);

			if (cached) {
				return cached;
			}

			const majors = await this.prisma.major.findMany({
				orderBy: { createdAt: 'desc' },
			});

			await this.cache.set(MajorService.CACHE_KEY, majors, CONSTANTS.TTL);

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
			const key = `${MajorService.CACHE_KEY}/${id}`;
			const cached = await this.cache.get(key);

			if (cached) {
				return cached;
			}

			const major = await this.prisma.major.findUnique({ where: { id } });

			if (!major) {
				this.logger.warn(`Major with id ${id} not found`);

				throw new NotFoundException(`Major not found`);
			}

			await this.cache.set(key, major, CONSTANTS.TTL);

			this.logger.log(`Major found with id: ${id}`);
			this.logger.debug('Major detail', major);

			return major;
		} catch (error) {
			this.logger.error('Error fetching major', error);

			throw error;
		}
	}
}
