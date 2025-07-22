import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CreateMilestoneDto, UpdateMilestoneDto } from '@/milestones/dtos';
import { mapMilestone } from '@/milestones/mappers';
import { MilestoneResponse } from '@/milestones/responses';
import { CacheHelperService, PrismaService } from '@/providers';
import { mapSemester } from '@/semesters/mappers';
import { SemesterResponse } from '@/semesters/responses';

import { SemesterStatus } from '~/generated/prisma';

@Injectable()
export class MilestoneAdminService {
	private readonly logger = new Logger(MilestoneAdminService.name);

	constructor(
		private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
	) {}

	async create(dto: CreateMilestoneDto): Promise<MilestoneResponse> {
		this.logger.log(`Creating milestone with name ${dto.name}`);
		try {
			await this.validateSemesterForModification(dto.semesterId);

			this.validateDateRange(dto.startDate, dto.endDate);

			await this.validateMilestoneUniqueness(
				dto.semesterId,
				dto.startDate,
				dto.endDate,
				dto.name,
				undefined,
			);

			const milestone = await this.prisma.milestone.create({
				data: dto,
			});

			await this.createSubmission(milestone.id, dto.semesterId);

			this.logger.log(`Milestone created with ID: ${milestone.id}`);

			return mapMilestone(milestone);
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
			const existing = await this.validateMilestone(id);

			await this.validateSemesterForModification(existing.semesterId);

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
				await this.validateMilestoneUniqueness(
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
			return mapMilestone(updated);
		} catch (error) {
			this.logger.error(`Failed to update milestone ${id}`, error);
			throw error;
		}
	}

	async delete(id: string): Promise<MilestoneResponse> {
		try {
			const existing = await this.validateMilestone(id);
			await this.validateSemesterForModification(existing.semesterId);

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
			this.logger.debug('Deleted Milestone', deleted);
			return mapMilestone(deleted);
		} catch (error) {
			this.logger.error(`Failed to delete milestone ${id}`, error);
			throw error;
		}
	}

	// ------------------------------------------------------------------------------------------
	// Additional methods for milestone management can be added here
	// ------------------------------------------------------------------------------------------

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

	private async validateMilestoneUniqueness(
		semesterId: string,
		startDate: Date,
		endDate: Date,
		name?: string,
		milestoneId?: string,
	): Promise<void> {
		if (name) {
			const duplicateName = await this.prisma.milestone.findFirst({
				where: {
					semesterId,
					name,
					id: milestoneId ? { not: milestoneId } : undefined,
				},
			});
			if (duplicateName) {
				throw new ConflictException(
					'Milestone name already exists in this semester',
				);
			}
		}

		const overlappingMilestone = await this.prisma.milestone.findFirst({
			where: {
				semesterId,
				id: milestoneId ? { not: milestoneId } : undefined,
				OR: [
					{ startDate: { lte: startDate }, endDate: { gt: startDate } },

					{ startDate: { lt: endDate }, endDate: { gte: endDate } },

					{ startDate: { gte: startDate }, endDate: { lte: endDate } },
				],
			},
		});

		if (overlappingMilestone) {
			throw new ConflictException(
				`Milestone time overlaps with existing milestone: ${overlappingMilestone.name}`,
			);
		}
	}

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

	private async validateSemester(
		semesterId: string,
	): Promise<SemesterResponse> {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});

		if (!semester) {
			this.logger.warn(`Semester with ID ${semesterId} not found`);
			throw new NotFoundException(`Semester not found`);
		}

		return mapSemester(semester);
	}

	private async validateMilestone(id: string): Promise<MilestoneResponse> {
		const milestone = await this.prisma.milestone.findUnique({
			where: { id },
		});

		if (!milestone) {
			throw new NotFoundException(`Milestone not found`);
		}
		return mapMilestone(milestone);
	}

	private async createSubmission(milestoneId: string, semesterId: string) {
		this.logger.log(`Creating submission for milestone ${milestoneId}...`);
		try {
			const listGroups = await this.prisma.group.findMany({
				where: { semesterId },
				select: { id: true },
			});

			if (listGroups.length === 0) {
				this.logger.warn(
					`No groups found for semester ${semesterId}. Skipping submission creation.`,
				);
				return;
			}

			await this.prisma.submission.createMany({
				data: listGroups.map((group) => ({
					groupId: group.id,
					milestoneId,
					status: 'NotSubmitted',
				})),
				skipDuplicates: true,
			});

			this.logger.log(
				`Submission created for milestone ${milestoneId} successfully`,
			);
		} catch (error) {
			this.logger.error(
				`Failed to create submission for milestone ${milestoneId}`,
				error,
			);
			throw error;
		}
	}
}
