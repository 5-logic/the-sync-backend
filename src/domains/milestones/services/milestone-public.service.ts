import { Injectable, Logger, NotFoundException } from '@nestjs/common';

// import { CACHE_KEY } from '@/milestones/constants';
import { mapMilestone } from '@/milestones/mappers';
import { MilestoneResponse } from '@/milestones/responses';
import { MilestoneService } from '@/milestones/services/milestone.service';
import {
	// CacheHelperService,
	PrismaService,
} from '@/providers';

@Injectable()
export class MilestonePublicService {
	private readonly logger = new Logger(MilestonePublicService.name);

	constructor(
		// private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
		private readonly milestoneService: MilestoneService,
	) {}

	async findAll(): Promise<MilestoneResponse[]> {
		this.logger.log('Fetching all milestones');

		try {
			// const cacheKey = `${CACHE_KEY}/`;
			// const cached =
			// 	await this.cache.getFromCache<MilestoneResponse[]>(cacheKey);
			// if (cached) {
			// 	this.logger.log('Returning cached milestones');

			// 	return cached;
			// }

			const milestones = await this.prisma.milestone.findMany({
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${milestones.length} milestones`);
			this.logger.debug('Milestones detail', JSON.stringify(milestones));

			const result: MilestoneResponse[] = milestones.map(mapMilestone);

			// await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error('Error fetching milestones', error);

			throw error;
		}
	}

	async findBySemester(semesterId: string): Promise<MilestoneResponse[]> {
		this.logger.log(`Fetching milestones for semester ${semesterId}`);

		try {
			// const cacheKey = `${CACHE_KEY}/semester/${semesterId}`;
			// const cached =
			// 	await this.cache.getFromCache<MilestoneResponse[]>(cacheKey);
			// if (cached) {
			// 	this.logger.log('Returning cached milestones for semester');
			// 	return cached;
			// }

			const semester = await this.milestoneService.validateSemester(semesterId);

			const milestones = await this.prisma.milestone.findMany({
				where: { semesterId: semester.id },
				orderBy: { startDate: 'asc' },
			});

			this.logger.log(
				`Found ${milestones.length} milestones for semester ${semesterId}`,
			);
			this.logger.debug('Milestones detail', JSON.stringify(milestones));

			const result: MilestoneResponse[] = milestones.map(mapMilestone);

			// await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error(
				`Error fetching milestones for semester ${semesterId}`,
				error,
			);

			throw error;
		}
	}

	async findOne(id: string): Promise<MilestoneResponse> {
		this.logger.log(`Fetching milestone with ID: ${id}`);

		try {
			// const cacheKey = `${CACHE_KEY}/${id}`;
			// const cached = await this.cache.getFromCache<MilestoneResponse>(cacheKey);
			// if (cached) {
			// 	this.logger.log('Returning cached milestone');
			// 	return cached;
			// }

			const milestone = await this.milestoneService.validateMilestone(id);

			if (!milestone) {
				throw new NotFoundException(`Milestone not found`);
			}

			this.logger.log(`Milestone found with ID: ${id}`);
			this.logger.debug('Milestone detail', JSON.stringify(milestone));

			// await this.cache.saveToCache(cacheKey, milestone);

			return milestone;
		} catch (error) {
			this.logger.error(`Error fetching milestone with ID ${id}`, error);
			throw error;
		}
	}
}
