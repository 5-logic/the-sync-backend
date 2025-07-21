import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CacheHelperService, PrismaService } from '@/providers';
import { CACHE_KEY } from '@/responsibilities/constants';
import { mapResponsibility } from '@/responsibilities/mappers';
import { ResponsibilityResponse } from '@/responsibilities/responses';

@Injectable()
export class ResponsibilityService {
	private readonly logger = new Logger(ResponsibilityService.name);

	constructor(
		private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
	) {}

	async findAll(): Promise<ResponsibilityResponse[]> {
		this.logger.log('Fetching all responsibilities');

		try {
			const cacheKey = `${CACHE_KEY}/`;
			const cache =
				await this.cache.getFromCache<ResponsibilityResponse[]>(cacheKey);
			if (cache) {
				this.logger.log('Returning cached responsibilities');

				return cache;
			}

			const responsibilities = await this.prisma.responsibility.findMany({
				orderBy: { name: 'asc' },
			});

			this.logger.log(`Fetched ${responsibilities.length} responsibilities`);
			this.logger.debug('Responsibilities:', JSON.stringify(responsibilities));

			const result: ResponsibilityResponse[] =
				responsibilities.map(mapResponsibility);

			await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error('Error fetching responsibilities', error);

			throw error;
		}
	}

	async findOne(id: string): Promise<ResponsibilityResponse> {
		this.logger.log(`Fetching responsibility with ID: ${id}`);

		try {
			const cacheKey = `${CACHE_KEY}/${id}`;
			const cache =
				await this.cache.getFromCache<ResponsibilityResponse>(cacheKey);
			if (cache) {
				this.logger.log(`Returning cached responsibility with ID: ${id}`);

				return cache;
			}

			const responsibility = await this.prisma.responsibility.findUnique({
				where: { id },
			});

			if (!responsibility) {
				this.logger.warn(`Responsibility with ID ${id} not found`);

				throw new NotFoundException(`Responsibility not found`);
			}

			this.logger.log(`Responsibility found with ID: ${id}`);
			this.logger.debug(
				'Responsibility detail:',
				JSON.stringify(responsibility),
			);

			const result: ResponsibilityResponse = mapResponsibility(responsibility);

			await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error(`Error fetching responsibility with ID ${id}`, error);

			throw error;
		}
	}
}
