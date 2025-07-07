import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { BaseCacheService } from '@/bases/base-cache.service';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailJobDto } from '@/queue/email/dto/email-job.dto';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import { AssignSupervisionDto, ChangeSupervisionDto } from '@/supervisions/dto';

@Injectable()
export class SupervisionService extends BaseCacheService {
	private static readonly CACHE_KEY = 'cache:supervision';

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) cacheManager: Cache,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
	) {
		super(cacheManager, SupervisionService.name);
	}

	/**
	 * Helper method để validate lecturer tồn tại và active
	 */
	private async validateLecturer(lecturerId: string, context = 'Lecturer') {
		const lecturer = await this.prisma.lecturer.findUnique({
			where: { userId: lecturerId },
			include: { user: true },
		});

		if (!lecturer) {
			this.logger.error(`${context} with ID ${lecturerId} does not exist`);
			throw new NotFoundException(
				`${context} with ID ${lecturerId} does not exist`,
			);
		}

		if (!lecturer.user.isActive) {
			this.logger.error(`${context} with ID ${lecturerId} is not active`);
			throw new BadRequestException(
				`${context} with ID ${lecturerId} is not active`,
			);
		}

		return lecturer;
	}

	/**
	 * Helper method để kiểm tra supervision đã tồn tại
	 */
	private async checkExistingSupervision(thesisId: string, lecturerId: string) {
		return this.prisma.supervision.findFirst({
			where: { thesisId, lecturerId },
		});
	}

	/**
	 * Helper method để đếm số supervision hiện tại của thesis
	 */
	private async getSupervisionCount(thesisId: string) {
		return this.prisma.supervision.count({
			where: { thesisId },
		});
	}

	/**
	 * Helper method để gửi email thông báo supervision
	 */
	private async sendSupervisionNotificationEmail(
		lecturerEmail: string,
		lecturerName: string,
		thesisName: string,
		thesisVietnameseName: string,
		thesisAbbreviation?: string,
		thesisDomain?: string,
		action: 'assigned' | 'removed' = 'assigned',
	) {
		const subjects = {
			assigned: 'Supervision Assignment - New Thesis Supervision',
			removed: 'Supervision Change - Thesis Supervision Removed',
		};

		const emailDto: EmailJobDto = {
			to: lecturerEmail,
			subject: subjects[action],
			context: {
				lecturerName,
				thesisName,
				thesisVietnameseName,
				thesisAbbreviation,
				thesisDomain,
				action,
			},
		};

		await this.emailQueueService.sendEmail(
			EmailJobType.SEND_SUPERVISION_NOTIFICATION,
			emailDto,
			500,
		);

		this.logger.log(`Supervision ${action} email sent to ${lecturerEmail}`);
	}

	async assignSupervisor(thesisId: string, dto: AssignSupervisionDto) {
		try {
			this.logger.log(
				`Assigning supervision for thesis ${thesisId} to lecturer ${dto.lecturerId}`,
			);

			await this.validateLecturer(dto.lecturerId);

			const existingSupervision = await this.checkExistingSupervision(
				thesisId,
				dto.lecturerId,
			);

			if (existingSupervision) {
				this.logger.warn(
					`Supervision for thesis ${thesisId} already exists for lecturer ${dto.lecturerId}`,
				);
				throw new ConflictException(`Thesis was supervised by this lecturer.`);
			}

			const currentSupervisionsCount = await this.getSupervisionCount(thesisId);

			if (currentSupervisionsCount >= 2) {
				this.logger.warn(
					`Thesis ${thesisId} has already reached the maximum number of supervisors (2)`,
				);
				throw new BadRequestException(
					`Thesis has already reached the maximum number of supervisors (2)`,
				);
			}

			const supervision = await this.prisma.supervision.create({
				data: {
					thesisId,
					lecturerId: dto.lecturerId,
				},
				include: {
					lecturer: {
						include: {
							user: true,
						},
					},
					thesis: true,
				},
			});

			this.logger.log(
				`Successfully assigned supervision for thesis ${thesisId} to lecturer ${dto.lecturerId}`,
			);

			// Clear relevant caches
			await this.clearCache(
				`${SupervisionService.CACHE_KEY}:thesis:${thesisId}`,
			);
			await this.clearCache(
				`${SupervisionService.CACHE_KEY}:lecturer:${dto.lecturerId}`,
			);
			this.logger.debug('Cache invalidated for supervision assignment');

			await this.sendSupervisionNotificationEmail(
				supervision.lecturer.user.email,
				supervision.lecturer.user.fullName,
				supervision.thesis.englishName,
				supervision.thesis.vietnameseName,
				supervision.thesis.abbreviation,
				supervision.thesis.domain ?? undefined,
				'assigned',
			);

			this.logger.debug(
				`Supervision assignment email sent to ${supervision.lecturer.user.email}`,
			);

			this.logger.log(`Supervision assignment email sent successfully.`);

			return {
				lecturerId: supervision.lecturerId,
				thesisId: supervision.thesisId,
			};
		} catch (error) {
			this.logger.error(
				`Failed to assign supervision for thesis ${thesisId}`,
				error,
			);
			throw error;
		}
	}

	async changeSupervisor(thesisId: string, dto: ChangeSupervisionDto) {
		try {
			this.logger.log(
				`Updating supervision for thesis ${thesisId} from lecturer ${dto.currentSupervisorId} to lecturer ${dto.newSupervisorId}`,
			);

			const existingSupervision = await this.checkExistingSupervision(
				thesisId,
				dto.currentSupervisorId,
			);

			if (!existingSupervision) {
				this.logger.error(
					`Supervision for thesis ${thesisId} with lecturer ${dto.currentSupervisorId} does not exist`,
				);
				throw new NotFoundException(
					`Thesis was not supervised by this lecturers.`,
				);
			}

			await this.validateLecturer(dto.newSupervisorId, 'New lecturer');

			const newLecturerSupervision = await this.checkExistingSupervision(
				thesisId,
				dto.newSupervisorId,
			);

			if (newLecturerSupervision) {
				this.logger.warn(
					`New lecturer ${dto.newSupervisorId} already has supervision for thesis ${thesisId}`,
				);
				throw new ConflictException(
					`New lecturer ${dto.newSupervisorId} already has supervision for thesis ${thesisId}`,
				);
			}

			const updatedSupervision = await this.prisma.supervision.update({
				where: {
					thesisId_lecturerId: {
						thesisId,
						lecturerId: dto.currentSupervisorId,
					},
				},
				data: {
					lecturerId: dto.newSupervisorId,
				},
				include: {
					lecturer: {
						include: {
							user: true,
						},
					},
					thesis: true,
				},
			});

			this.logger.log(
				`Successfully updated supervision for thesis ${thesisId} from lecturer ${dto.currentSupervisorId} to lecturer ${dto.newSupervisorId}`,
			);

			// Clear relevant caches
			await this.clearCache(
				`${SupervisionService.CACHE_KEY}:thesis:${thesisId}`,
			);
			await this.clearCache(
				`${SupervisionService.CACHE_KEY}:lecturer:${dto.currentSupervisorId}`,
			);
			await this.clearCache(
				`${SupervisionService.CACHE_KEY}:lecturer:${dto.newSupervisorId}`,
			);
			this.logger.debug('Cache invalidated for supervision change');

			const oldLecturer = await this.prisma.lecturer.findUnique({
				where: { userId: dto.currentSupervisorId },
				include: { user: true },
			});

			if (oldLecturer) {
				await this.sendSupervisionNotificationEmail(
					oldLecturer.user.email,
					oldLecturer.user.fullName,
					updatedSupervision.thesis.englishName,
					updatedSupervision.thesis.vietnameseName,
					updatedSupervision.thesis.abbreviation,
					updatedSupervision.thesis.domain ?? undefined,
					'removed',
				);
			}

			await this.sendSupervisionNotificationEmail(
				updatedSupervision.lecturer.user.email,
				updatedSupervision.lecturer.user.fullName,
				updatedSupervision.thesis.englishName,
				updatedSupervision.thesis.vietnameseName,
				updatedSupervision.thesis.abbreviation,
				updatedSupervision.thesis.domain ?? undefined,
				'assigned',
			);

			return {
				lecturerId: updatedSupervision.lecturerId,
				thesisId: updatedSupervision.thesisId,
			};
		} catch (error) {
			this.logger.error(
				`Failed to update supervision for thesis ${thesisId}`,
				error,
			);
			throw error;
		}
	}

	async removeSupervisor(thesisId: string, lecturerId: string) {
		try {
			this.logger.log(
				`Removing supervision for thesis ${thesisId} from lecturer ${lecturerId}`,
			);

			const existingSupervision = await this.checkExistingSupervision(
				thesisId,
				lecturerId,
			);

			if (!existingSupervision) {
				this.logger.error(
					`Supervision for thesis ${thesisId} with lecturer ${lecturerId} does not exist`,
				);
				throw new NotFoundException(
					`This thesis was not supervised by this lecturers.`,
				);
			}

			const currentSupervisionsCount = await this.getSupervisionCount(thesisId);

			if (currentSupervisionsCount <= 1) {
				this.logger.warn(
					`Cannot remove supervisor: thesis ${thesisId} must have at least 1 supervisor`,
				);
				throw new BadRequestException(
					`Cannot remove supervisor of thesis because thesis must have at least 1 supervisor`,
				);
			}

			const supervisionToDelete = await this.prisma.supervision.findFirst({
				where: {
					thesisId,
					lecturerId,
				},
				include: {
					lecturer: {
						include: {
							user: true,
						},
					},
					thesis: true,
				},
			});

			await this.prisma.supervision.delete({
				where: {
					thesisId_lecturerId: {
						thesisId,
						lecturerId,
					},
				},
			});

			this.logger.log(
				`Successfully removed supervision for thesis ${thesisId} from lecturer ${lecturerId}`,
			);

			// Clear relevant caches
			await this.clearCache(
				`${SupervisionService.CACHE_KEY}:thesis:${thesisId}`,
			);
			await this.clearCache(
				`${SupervisionService.CACHE_KEY}:lecturer:${lecturerId}`,
			);
			this.logger.debug('Cache invalidated for supervision removal');

			if (supervisionToDelete) {
				await this.sendSupervisionNotificationEmail(
					supervisionToDelete.lecturer.user.email,
					supervisionToDelete.lecturer.user.fullName,
					supervisionToDelete.thesis.englishName,
					supervisionToDelete.thesis.vietnameseName,
					supervisionToDelete.thesis.abbreviation,
					supervisionToDelete.thesis.domain ?? undefined,
					'removed',
				);
			}

			return { lecturerId, thesisId };
		} catch (error) {
			this.logger.error(
				`Failed to remove supervision for thesis ${thesisId}`,
				error,
			);
			throw error;
		}
	}

	async getSupervisionsByThesis(thesisId: string) {
		try {
			this.logger.log(`Getting supervisions for thesis ${thesisId}`);

			const cacheKey = `${SupervisionService.CACHE_KEY}:thesis:${thesisId}`;
			const cachedData = await this.getCachedData(cacheKey);

			if (cachedData) {
				this.logger.log(`Found cached supervisions for thesis ${thesisId}`);
				return cachedData;
			}

			const supervisions = await this.prisma.supervision.groupBy({
				where: { thesisId },
				by: ['lecturerId'],
			});

			await this.setCachedData(cacheKey, supervisions);

			this.logger.log(
				`Found ${supervisions.length} supervisions for thesis ${thesisId}`,
			);

			return supervisions;
		} catch (error) {
			this.logger.error(
				`Failed to get supervisions for thesis ${thesisId}`,
				error,
			);
			throw error;
		}
	}

	async getSupervisionsByLecturer(lecturerId: string) {
		try {
			this.logger.log(`Getting supervisions for lecturer ${lecturerId}`);

			const cacheKey = `${SupervisionService.CACHE_KEY}:lecturer:${lecturerId}`;
			const cachedData = await this.getCachedData(cacheKey);

			if (cachedData) {
				this.logger.log(`Found cached supervisions for lecturer ${lecturerId}`);
				return cachedData;
			}

			const supervisions = await this.prisma.supervision.groupBy({
				where: { lecturerId },
				by: ['thesisId'],
			});

			await this.setCachedData(cacheKey, supervisions);

			this.logger.log(
				`Found ${supervisions.length} supervisions for lecturer ${lecturerId}`,
			);

			return supervisions;
		} catch (error) {
			this.logger.error(
				`Failed to get supervisions for lecturer ${lecturerId}`,
				error,
			);
			throw error;
		}
	}
}
