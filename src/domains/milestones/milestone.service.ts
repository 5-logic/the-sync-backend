import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { BaseCacheService } from '@/bases/base-cache.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from '@/milestones/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';

import { SemesterStatus } from '~/generated/prisma';

@Injectable()
export class MilestoneService extends BaseCacheService {
	private static readonly CACHE_KEY = 'cache:milestone';

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) cacheManager: Cache,
	) {
		super(cacheManager, MilestoneService.name);
	}

	private async validateSemester(semesterId: string) {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});

		if (!semester) {
			throw new NotFoundException(`Semester not found`);
		}

		return semester;
	}

	private async validateSemesterForModification(
		semesterId: string,
	): Promise<void> {
		const semester = await this.validateSemester(semesterId);

		if (semester.status !== SemesterStatus.Ongoing) {
			throw new ConflictException(
				`Milestone can only be created/modified in a semester with status ${SemesterStatus.Ongoing}. Current status: ${semester.status}`,
			);
		}
	}

	private validateDateRange(startDate: Date, endDate: Date) {
		// Reset time to 00:00:00 for date-only comparison
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const startDateOnly = new Date(startDate);
		startDateOnly.setHours(0, 0, 0, 0);

		const endDateOnly = new Date(endDate);
		endDateOnly.setHours(0, 0, 0, 0);

		if (startDateOnly < today) {
			throw new ConflictException('Milestone start date cannot be in the past');
		}

		if (startDateOnly >= endDateOnly) {
			throw new ConflictException(
				'Milestone start date must be before end date',
			);
		}
	}

	private async validateMilestone(id: string) {
		const milestone = await this.prisma.milestone.findUnique({
			where: { id },
		});

		if (!milestone) {
			throw new NotFoundException(`Milestone not found`);
		}

		return milestone;
	}

	async create(dto: CreateMilestoneDto) {
		try {
			await this.validateSemesterForModification(dto.semesterId);

			const startDate = new Date(dto.startDate);
			const endDate = new Date(dto.endDate);

			this.validateDateRange(startDate, endDate);

			const overlappingMilestone = await this.prisma.milestone.findFirst({
				where: {
					semesterId: dto.semesterId,
					OR: [
						// Case 1: New milestone starts during an existing milestone
						{
							startDate: { lte: startDate },
							endDate: { gt: startDate },
						},
						// Case 2: New milestone ends during an existing milestone
						{
							startDate: { lt: endDate },
							endDate: { gte: endDate },
						},
						// Case 3: New milestone completely contains an existing milestone
						{
							startDate: { gte: startDate },
							endDate: { lte: endDate },
						},
						// Case 4: Existing milestone completely contains the new milestone
						{
							startDate: { lte: startDate },
							endDate: { gte: endDate },
						},
					],
				},
			});

			if (overlappingMilestone) {
				throw new ConflictException(
					`Milestone time overlaps with existing milestone: ${overlappingMilestone.name}`,
				);
			}

			const milestone = await this.prisma.milestone.create({
				data: {
					name: dto.name,
					startDate: startDate,
					endDate: endDate,
					semesterId: dto.semesterId,
				},
			});

			// Clear cache after successful creation
			await this.clearCache(`${MilestoneService.CACHE_KEY}:all`);

			this.logger.log(`Milestone created with ID: ${milestone.id}`);
			this.logger.debug('Milestone detail', milestone);

			return milestone;
		} catch (error) {
			this.logger.error('Failed to create milestone', error);

			throw error;
		}
	}

	async findAll() {
		try {
			this.logger.log('Fetching all milestones');

			// Check cache first
			const cacheKey = `${MilestoneService.CACHE_KEY}:all`;
			const cachedMilestones = await this.getCachedData<any[]>(cacheKey);
			if (cachedMilestones) {
				this.logger.log(
					`Found ${cachedMilestones.length} milestones (from cache)`,
				);
				return cachedMilestones;
			}

			const milestones = await this.prisma.milestone.findMany({
				orderBy: { createdAt: 'desc' },
			});

			// Cache the result
			await this.setCachedData(cacheKey, milestones);

			this.logger.log(`Found ${milestones.length} milestones`);
			this.logger.debug('Milestones detail', milestones);

			return milestones;
		} catch (error) {
			this.logger.error('Error fetching milestones', error);

			throw error;
		}
	}

	async findOne(id: string) {
		try {
			this.logger.log(`Fetching milestone with ID: ${id}`);

			// Check cache first
			const cacheKey = `${MilestoneService.CACHE_KEY}:${id}`;
			const cachedMilestone = await this.getCachedData<any>(cacheKey);
			if (cachedMilestone) {
				this.logger.log(`Milestone found with ID: ${id} (from cache)`);
				return cachedMilestone;
			}

			const milestone = await this.validateMilestone(id);

			if (!milestone) {
				throw new NotFoundException(`Milestone not found`);
			}

			// Cache the result
			await this.setCachedData(cacheKey, milestone);

			this.logger.log(`Milestone found with ID: ${id}`);
			this.logger.debug('Milestone detail', milestone);

			return milestone;
		} catch (error) {
			this.logger.error(`Error fetching milestone with ID ${id}`, error);
			throw error;
		}
	}

	async update(id: string, dto: UpdateMilestoneDto) {
		try {
			const existing = await this.validateMilestone(id);

			await this.validateSemesterForModification(existing.semesterId);

			// Rule: Milestones can only be updated before their start date (date-only comparison)
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const existingStartDateOnly = new Date(existing.startDate);
			existingStartDateOnly.setHours(0, 0, 0, 0);

			if (today >= existingStartDateOnly) {
				throw new ConflictException(
					'Milestone can only be updated before its start date',
				);
			}

			const startDate = dto.startDate
				? new Date(dto.startDate)
				: existing.startDate;
			const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

			// Validate date range rules
			this.validateDateRange(startDate, endDate);

			// Check for overlaps with other milestones (excluding current milestone)
			const overlap = await this.prisma.milestone.findFirst({
				where: {
					id: { not: id },
					semesterId: existing.semesterId,
					OR: [
						// Case 1: Updated milestone starts during an existing milestone
						{
							startDate: { lte: startDate },
							endDate: { gt: startDate },
						},
						// Case 2: Updated milestone ends during an existing milestone
						{
							startDate: { lt: endDate },
							endDate: { gte: endDate },
						},
						// Case 3: Updated milestone completely contains an existing milestone
						{
							startDate: { gte: startDate },
							endDate: { lte: endDate },
						},
						// Case 4: Existing milestone completely contains the updated milestone
						{
							startDate: { lte: startDate },
							endDate: { gte: endDate },
						},
					],
				},
			});

			if (overlap) {
				throw new ConflictException(
					`Updated milestone overlaps with: ${overlap.name}`,
				);
			}

			const updated = await this.prisma.milestone.update({
				where: { id },
				data: {
					name: dto.name,
					startDate: dto.startDate,
					endDate: dto.endDate,
				},
			});

			// Clear cache after successful update
			await this.clearCache(`${MilestoneService.CACHE_KEY}:all`);
			await this.clearCache(`${MilestoneService.CACHE_KEY}:${id}`);

			this.logger.log(`Milestone updated with ID: ${updated.id}`);
			this.logger.debug('Updated Milestone', updated);

			return updated;
		} catch (error) {
			this.logger.error(`Failed to update milestone ${id}`, error);

			throw error;
		}
	}

	async delete(id: string) {
		try {
			const existing = await this.validateMilestone(id);

			await this.validateSemesterForModification(existing.semesterId);

			// Rule: Milestone can only be deleted before its start date (date-only comparison)
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const existingStartDateOnly = new Date(existing.startDate);
			existingStartDateOnly.setHours(0, 0, 0, 0);

			if (today >= existingStartDateOnly) {
				throw new ConflictException(
					'Milestone can only be deleted before its start date',
				);
			}

			const deleted = await this.prisma.milestone.delete({
				where: { id },
			});

			// Clear cache after successful deletion
			await this.clearCache(`${MilestoneService.CACHE_KEY}:all`);
			await this.clearCache(`${MilestoneService.CACHE_KEY}:${id}`);

			this.logger.log(`Milestone deleted with ID: ${deleted.id}`);
			this.logger.debug('Deleted Milestone', deleted);

			return deleted;
		} catch (error) {
			this.logger.error(`Failed to delete milestone ${id}`, error);

			throw error;
		}
	}
}
