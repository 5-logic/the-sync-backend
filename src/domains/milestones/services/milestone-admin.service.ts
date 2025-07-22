import { ConflictException, Injectable, Logger } from '@nestjs/common';

import { CACHE_KEY } from '@/milestones/constants';
import { CreateMilestoneDto, UpdateMilestoneDto } from '@/milestones/dtos';
import { mapMilestone } from '@/milestones/mappers';
import { MilestoneResponse } from '@/milestones/responses';
import { MilestoneService } from '@/milestones/services/milestone.service';
import { CacheHelperService, PrismaService } from '@/providers';

@Injectable()
export class MilestoneAdminService {
	private readonly logger = new Logger(MilestoneAdminService.name);

	constructor(
		private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
		private readonly milestoneService: MilestoneService,
	) {}

	async create(dto: CreateMilestoneDto): Promise<MilestoneResponse> {
		this.logger.log(`Creating milestone with name ${dto.name}`);

		try {
			await this.milestoneService.validateSemesterForModification(
				dto.semesterId,
			);

			this.validateDateRange(dto.startDate, dto.endDate);

			await this.milestoneService.validateMilestoneUniqueness(
				dto.semesterId,
				dto.startDate,
				dto.endDate,
				dto.name,
			);

			const resultTx = await this.prisma.$transaction(async (tx) => {
				const milestone = await tx.milestone.create({
					data: dto,
				});

				const listGroups = await tx.group.findMany({
					where: { semesterId: dto.semesterId },
					select: { id: true },
				});

				if (listGroups.length === 0) {
					this.logger.warn(
						`No groups found for semester ${dto.semesterId}, skipping submission creation.`,
					);
					return milestone;
				}

				if (listGroups.length > 0) {
					await tx.submission.createMany({
						data: listGroups.map((group) => ({
							groupId: group.id,
							milestoneId: milestone.id,
							status: 'NotSubmitted',
						})),
						skipDuplicates: true,
					});
				}

				return milestone;
			});
			const milestone = resultTx;

			this.logger.log(`Milestone created with ID: ${milestone.id}`);
			this.logger.debug('Created Milestone', JSON.stringify(milestone));

			const result: MilestoneResponse = mapMilestone(milestone);

			const cacheKey = `${CACHE_KEY}/${milestone.id}`;
			await this.cache.saveToCache(cacheKey, result);
			await this.deleteCacheForMilestone(result);

			return result;
		} catch (error) {
			this.logger.error('Failed to create milestone', error);

			throw error;
		}
	}

	async update(
		id: string,
		dto: UpdateMilestoneDto,
	): Promise<MilestoneResponse> {
		this.logger.log(`Updating milestone with ID: ${id}`);

		try {
			const existing = await this.milestoneService.validateMilestone(id);

			await this.milestoneService.validateSemesterForModification(
				existing.semesterId,
			);

			if (new Date() >= new Date(existing.startDate)) {
				throw new ConflictException(
					'Milestone can only be updated before its start date',
				);
			}

			const newStartDate = new Date(dto.startDate ?? existing.startDate);
			const newEndDate = new Date(dto.endDate ?? existing.endDate);

			if (dto.startDate || dto.endDate) {
				this.validateDateRange(newStartDate, newEndDate);
			}

			if (dto.name || dto.startDate || dto.endDate) {
				await this.milestoneService.validateMilestoneUniqueness(
					existing.semesterId,
					newStartDate,
					newEndDate,
					dto.name,
					id,
				);
			}

			const updated = await this.prisma.milestone.update({
				where: { id },

				data: dto,
			});

			this.logger.log(`Milestone updated with ID: ${updated.id}`);
			this.logger.debug('Updated Milestone', JSON.stringify(updated));

			const result: MilestoneResponse = mapMilestone(updated);

			const cacheKey = `${CACHE_KEY}/${updated.id}`;
			await this.cache.saveToCache(cacheKey, result);
			await this.deleteCacheForMilestone(result);

			return result;
		} catch (error) {
			this.logger.error(`Failed to update milestone ${id}`, error);

			throw error;
		}
	}

	async delete(id: string): Promise<MilestoneResponse> {
		this.logger.log(`Deleting milestone with ID: ${id}`);

		try {
			const existing = await this.milestoneService.validateMilestone(id);
			await this.milestoneService.validateSemesterForModification(
				existing.semesterId,
			);

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const startDateOnly = new Date(existing.startDate);
			startDateOnly.setHours(0, 0, 0, 0);

			if (today >= startDateOnly) {
				this.logger.warn(
					`Cannot delete milestone ${id}: must be before its start date`,
				);
				throw new ConflictException(
					'Milestone can only be deleted before its start date',
				);
			}

			const submissions = await this.prisma.submission.findMany({
				where: { milestoneId: id },
				select: { id: true, status: true },
			});
			const submissionIds = submissions.map((s) => s.id);

			if (submissions.some((s) => s.status !== 'NotSubmitted')) {
				this.logger.warn(
					`Cannot delete milestone ${id}: all submissions must have status NotSubmitted.`,
				);

				throw new ConflictException(
					'Cannot delete milestone because have group submissions',
				);
			}

			const [
				checklistCount,
				reviewCount,
				assignmentReviewCount,
				checklistItemCount,
				reviewItemCount,
			] = await Promise.all([
				this.prisma.checklist.count({ where: { milestoneId: id } }),
				submissionIds.length > 0
					? this.prisma.review.count({
							where: { submissionId: { in: submissionIds } },
						})
					: Promise.resolve(0),
				submissionIds.length > 0
					? this.prisma.assignmentReview.count({
							where: { submissionId: { in: submissionIds } },
						})
					: Promise.resolve(0),
				this.prisma.checklistItem.count({
					where: { checklist: { milestoneId: id } },
				}),
				submissionIds.length > 0
					? this.prisma.reviewItem.count({
							where: { review: { submissionId: { in: submissionIds } } },
						})
					: Promise.resolve(0),
			]);

			if (checklistCount > 0) {
				this.logger.warn(
					`Cannot delete milestone ${id}: related checklist(s) exist.`,
				);
				throw new ConflictException(
					'Cannot delete milestone: related checklist(s) exist.',
				);
			}
			if (reviewCount > 0) {
				this.logger.warn(
					`Cannot delete milestone ${id}: related review(s) exist.`,
				);
				throw new ConflictException(
					'Cannot delete milestone: related review(s) exist.',
				);
			}
			if (assignmentReviewCount > 0) {
				this.logger.warn(
					`Cannot delete milestone ${id}: related assignment review(s) exist.`,
				);
				throw new ConflictException(
					'Cannot delete milestone: related assignment review(s) exist.',
				);
			}
			if (checklistItemCount > 0) {
				this.logger.warn(
					`Cannot delete milestone ${id}: related checklist item(s) exist.`,
				);
				throw new ConflictException(
					'Cannot delete milestone: related checklist item(s) exist.',
				);
			}
			if (reviewItemCount > 0) {
				this.logger.warn(
					`Cannot delete milestone ${id}: related review item(s) exist.`,
				);
				throw new ConflictException(
					'Cannot delete milestone: related review item(s) exist.',
				);
			}

			if (submissionIds.length > 0) {
				await this.prisma.submission.deleteMany({
					where: { id: { in: submissionIds } },
				});
			}

			const deleted = await this.prisma.milestone.delete({ where: { id } });

			this.logger.log(`Milestone deleted with ID: ${deleted.id}`);
			this.logger.debug('Deleted Milestone', JSON.stringify(deleted));

			const result: MilestoneResponse = mapMilestone(deleted);

			await this.cache.delete(`${CACHE_KEY}/${id}`);
			await this.deleteCacheForMilestone(result);

			return result;
		} catch (error) {
			this.logger.error(`Failed to delete milestone ${id}`, error);

			throw error;
		}
	}

	// ------------------------------------------------------------------------------------------
	// Additional methods for milestone management can be added here
	// ------------------------------------------------------------------------------------------

	private validateDateRange(startDate: Date, endDate: Date): void {
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

	async deleteCacheForMilestone(milestone: MilestoneResponse): Promise<void> {
		await Promise.all([
			await this.cache.delete(`${CACHE_KEY}/`),
			await this.cache.delete(`${CACHE_KEY}/semester/${milestone.semesterId}`),
		]);
	}
}
