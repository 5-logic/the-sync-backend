import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailJobDto } from '@/queue/email/dto/email-job.dto';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import {
	AssignBulkSupervisionDto,
	ChangeSupervisionDto,
} from '@/supervisions/dto';

type AssignmentStatus =
	| 'success'
	| 'already_exists'
	| 'max_supervisors_reached'
	| 'error';

@Injectable()
export class SupervisionService {
	private readonly logger = new Logger(SupervisionService.name);

	// private static readonly CACHE_KEY = 'cache:supervision';

	constructor(
		private readonly prisma: PrismaService,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
	) {}

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

	private async processLecturerAssignment(
		thesisId: string,
		lecturerId: string,
		results: Array<{
			thesisId: string;
			lecturerId: string;
			status: AssignmentStatus;
			error?: string;
		}>,
	) {
		try {
			await this.validateLecturer(lecturerId);

			const existingSupervision = await this.checkExistingSupervision(
				thesisId,
				lecturerId,
			);

			if (existingSupervision) {
				this.logger.warn(
					`Supervision for thesis ${thesisId} already exists for lecturer ${lecturerId}`,
				);
				results.push({ thesisId, lecturerId, status: 'already_exists' });
				return;
			}

			const currentSupervisionsCount = await this.getSupervisionCount(thesisId);

			if (currentSupervisionsCount >= 2) {
				this.logger.warn(
					`Thesis ${thesisId} has already reached the maximum number of supervisors (2)`,
				);
				results.push({
					thesisId,
					lecturerId,
					status: 'max_supervisors_reached',
				});
				return;
			}

			const supervision = await this.prisma.supervision.create({
				data: {
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

			await this.sendSupervisionNotificationEmail(
				supervision.lecturer.user.email,
				supervision.lecturer.user.fullName,
				supervision.thesis.englishName,
				supervision.thesis.vietnameseName,
				supervision.thesis.abbreviation,
				supervision.thesis.domain ?? undefined,
				'assigned',
			);

			results.push({ thesisId, lecturerId, status: 'success' });
		} catch (error) {
			this.logger.error(
				`Failed to assign supervisor for thesis ${thesisId} and lecturer ${lecturerId}`,
				error,
			);
			results.push({
				thesisId,
				lecturerId,
				status: 'error',
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	private async processAssignment(
		assignment: { thesisId: string; lecturerIds?: string[] },
		results: Array<{
			thesisId: string;
			lecturerId: string;
			status: AssignmentStatus;
			error?: string;
		}>,
	) {
		const { thesisId, lecturerIds } = assignment;

		if (!lecturerIds || lecturerIds.length === 0) {
			return;
		}

		for (const lecturerId of lecturerIds) {
			await this.processLecturerAssignment(thesisId, lecturerId, results);
		}
	}

	async assignBulkSupervisor(dto: AssignBulkSupervisionDto) {
		// Lấy tất cả thesisId cần kiểm tra
		const thesisIds = dto.assignments.map((a) => a.thesisId);
		const theses = await this.prisma.thesis.findMany({
			where: { id: { in: thesisIds } },
			select: { id: true, englishName: true, status: true },
		});

		const notApproved = theses.filter((t) => t.status !== 'Approved');
		if (notApproved.length > 0) {
			const thesisNames = notApproved
				.map(function (t) {
					return t.englishName ? t.englishName : t.id;
				})
				.join(', ');
			const errorMessage =
				'The following theses are not approved: ' + thesisNames;
			throw new BadRequestException(errorMessage);
		}

		// Xóa supervisor cũ nếu có trước khi tạo mới
		for (const assignment of dto.assignments) {
			const { thesisId } = assignment;
			// Kiểm tra thesis đã có supervisor chưa
			const oldSupervisions = await this.prisma.supervision.findMany({
				where: { thesisId },
				select: { thesisId: true, lecturerId: true },
			});
			if (oldSupervisions.length > 0) {
				// Xóa hết supervisor cũ
				await this.prisma.supervision.deleteMany({ where: { thesisId } });
			}
		}

		const results: Array<{
			thesisId: string;
			lecturerId: string;
			status: AssignmentStatus;
			error?: string;
		}> = [];

		for (const assignment of dto.assignments) {
			await this.processAssignment(assignment, results);
		}

		return results;
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

			// No cache to clear since we don't cache list operations
			this.logger.debug('No cache invalidation needed for supervision change');

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
				throw new BadRequestException();
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

			// No cache to clear since we don't cache list operations
			// this.logger.debug('No cache invalidation needed for supervision removal');

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

			// No cache for list operations to ensure real-time data
			const supervisions = await this.prisma.supervision.groupBy({
				where: { thesisId },
				by: ['lecturerId'],
			});

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

			// No cache for list operations to ensure real-time data
			const supervisions = await this.prisma.supervision.groupBy({
				where: { lecturerId },
				by: ['thesisId'],
			});

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
