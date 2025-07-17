import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CACHE_KEY } from '@/majors/constants';
import { mapMajor } from '@/majors/mappers';
import { MajorResponse } from '@/majors/responses';
import { CacheHelperService, PrismaService } from '@/providers';

@Injectable()
export class MajorService {
	private readonly logger = new Logger(MajorService.name);

	constructor(
		private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
	) {}

	async findAll(): Promise<MajorResponse[]> {
		this.logger.log('Fetching all majors');

		try {
			const cacheKey = `${CACHE_KEY}/`;
			const cache = await this.cache.getFromCache<MajorResponse[]>(cacheKey);
			if (cache) {
				this.logger.log('Returning cached majors');

				return cache;
			}

			const majors = await this.prisma.major.findMany({
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Fetched ${majors.length} majors`);
			this.logger.debug('Majors:', JSON.stringify(majors));

			const result: MajorResponse[] = majors.map(mapMajor);

			await this.cache.saveToCache(cacheKey, result);

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
			const cache = await this.cache.getFromCache<MajorResponse>(cacheKey);
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
			this.logger.debug('Major detail', JSON.stringify(major));

			const result: MajorResponse = mapMajor(major);

			await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error(`Error fetching major with id ${id}`, error);

			throw error;
		}
	}
}
