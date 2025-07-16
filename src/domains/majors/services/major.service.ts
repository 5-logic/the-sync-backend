import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CONSTANTS } from '@/configs';
import { CACHE_KEY } from '@/majors/constants';
import { MajorResponse } from '@/majors/responses';
import { PrismaService } from '@/providers';

@Injectable()
export class MajorService {
	private readonly logger = new Logger(MajorService.name);

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) private readonly cache: Cache,
	) {}

	async findAll(): Promise<MajorResponse[]> {
		this.logger.log('Fetching all majors');

		try {
			const cacheKey = `${CACHE_KEY}/`;
			const cache = await this.cache.get<MajorResponse[]>(cacheKey);
			if (cache) {
				this.logger.log('Returning cached majors');

				return cache;
			}

			const majors = await this.prisma.major.findMany({
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Fetched ${majors.length} majors`);
			this.logger.debug('Majors:', majors);

			await this.cache.set(cacheKey, majors, CONSTANTS.TTL);

			const result: MajorResponse[] = majors.map((major) => ({
				id: major.id,
				name: major.name,
				code: major.code,
				createdAt: major.createdAt.toISOString(),
				updatedAt: major.updatedAt.toISOString(),
			}));

			return result;
		} catch (error) {
			this.logger.error('Error fetching majors', error);

			throw error;
		}
	}

	async findOne(id: string): Promise<MajorResponse> {
		this.logger.log(`Fetching major with id: ${id}`);

		try {
			const cacheKey = `${CACHE_KEY}/${id}`;
			const cache = await this.cache.get<MajorResponse>(cacheKey);
			if (cache) {
				this.logger.log(`Returning cached major with id: ${id}`);

				return cache;
			}

			const major = await this.prisma.major.findUnique({ where: { id } });

			if (!major) {
				this.logger.warn(`Major with id ${id} not found`);

				throw new NotFoundException(`Major not found`);
			}

			this.logger.log(`Major found with id: ${id}`);
			this.logger.debug('Major detail', major);

			await this.cache.set(cacheKey, major, CONSTANTS.TTL);

			const result: MajorResponse = {
				id: major.id,
				name: major.name,
				code: major.code,
				createdAt: major.createdAt.toISOString(),
				updatedAt: major.updatedAt.toISOString(),
			};

			return result;
		} catch (error) {
			this.logger.error(`Error fetching major with id ${id}`, error);

			throw error;
		}
	}
}
