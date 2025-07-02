import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailJobDto } from '@/queue/email/dto/email-job.dto';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import { AssignSupervisionDto } from '@/supervisions/dto/assign-supervision.dto';
import { UpdateSupervisionDto } from '@/supervisions/dto/update-supervision.dto';

@Injectable()
export class SupervisionsService {
	private readonly logger = new Logger(SupervisionsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailQueueService,
	) {}

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

		await this.email.sendEmail(
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

			const existingLecturer = await this.prisma.lecturer.findUnique({
				where: { userId: dto.lecturerId },
				include: { user: true },
			});

			if (!existingLecturer) {
				this.logger.error(`Lecturer with ID ${dto.lecturerId} does not exist`);
				throw new NotFoundException(
					`Lecturer with ID ${dto.lecturerId} does not exist`,
				);
			}

			if (!existingLecturer.user.isActive) {
				this.logger.error(`Lecturer with ID ${dto.lecturerId} is not active`);
				throw new BadRequestException(
					`Lecturer with ID ${dto.lecturerId} is not active`,
				);
			}

			const existingSupervision = await this.prisma.supervision.findFirst({
				where: {
					thesisId,
					lecturerId: dto.lecturerId,
				},
			});

			if (existingSupervision) {
				this.logger.warn(
					`Supervision for thesis ${thesisId} already exists for lecturer ${dto.lecturerId}`,
				);
				throw new ConflictException(
					`Supervision for thesis ${thesisId} already exists for lecturer ${dto.lecturerId}`,
				);
			}

			const currentSupervisionsCount = await this.prisma.supervision.count({
				where: { thesisId },
			});

			if (currentSupervisionsCount >= 2) {
				this.logger.warn(
					`Thesis ${thesisId} has already reached the maximum number of supervisors (2)`,
				);
				throw new BadRequestException(
					`Thesis ${thesisId} has already reached the maximum number of supervisors (2)`,
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

			// Gửi email thông báo cho lecturer
			await this.sendSupervisionNotificationEmail(
				supervision.lecturer.user.email,
				supervision.lecturer.user.fullName,
				supervision.thesis.englishName,
				supervision.thesis.vietnameseName,
				supervision.thesis.abbreviation,
				supervision.thesis.domain ?? undefined,
				'assigned',
			);

			return supervision;
		} catch (error) {
			this.logger.error(
				`Failed to assign supervision for thesis ${thesisId}`,
				error,
			);
			throw error;
		}
	}

	async updateSupervisor(thesisId: string, dto: UpdateSupervisionDto) {
		try {
			this.logger.log(
				`Updating supervision for thesis ${thesisId} from lecturer ${dto.oldLecturerId} to lecturer ${dto.newLecturerId}`,
			);

			const existingSupervision = await this.prisma.supervision.findFirst({
				where: {
					thesisId,
					lecturerId: dto.oldLecturerId,
				},
			});

			if (!existingSupervision) {
				this.logger.error(
					`Supervision for thesis ${thesisId} with lecturer ${dto.oldLecturerId} does not exist`,
				);
				throw new NotFoundException(
					`Supervision for thesis ${thesisId} with lecturer ${dto.oldLecturerId} does not exist`,
				);
			}

			const newLecturer = await this.prisma.lecturer.findUnique({
				where: { userId: dto.newLecturerId },
				include: { user: true },
			});

			if (!newLecturer) {
				this.logger.error(
					`New lecturer with ID ${dto.newLecturerId} does not exist`,
				);
				throw new NotFoundException(
					`New lecturer with ID ${dto.newLecturerId} does not exist`,
				);
			}

			if (!newLecturer.user.isActive) {
				this.logger.error(
					`New lecturer with ID ${dto.newLecturerId} is not active`,
				);
				throw new BadRequestException(
					`New lecturer with ID ${dto.newLecturerId} is not active`,
				);
			}

			const newLecturerSupervision = await this.prisma.supervision.findFirst({
				where: {
					thesisId,
					lecturerId: dto.newLecturerId,
				},
			});

			if (newLecturerSupervision) {
				this.logger.warn(
					`New lecturer ${dto.newLecturerId} already has supervision for thesis ${thesisId}`,
				);
				throw new ConflictException(
					`New lecturer ${dto.newLecturerId} already has supervision for thesis ${thesisId}`,
				);
			}

			const updatedSupervision = await this.prisma.supervision.update({
				where: {
					thesisId_lecturerId: {
						thesisId,
						lecturerId: dto.oldLecturerId,
					},
				},
				data: {
					lecturerId: dto.newLecturerId,
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
				`Successfully updated supervision for thesis ${thesisId} from lecturer ${dto.oldLecturerId} to lecturer ${dto.newLecturerId}`,
			);

			// Lấy thông tin lecturer cũ để gửi email thông báo
			const oldLecturer = await this.prisma.lecturer.findUnique({
				where: { userId: dto.oldLecturerId },
				include: { user: true },
			});

			// Gửi email cho lecturer cũ
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

			// Gửi email cho lecturer mới
			await this.sendSupervisionNotificationEmail(
				updatedSupervision.lecturer.user.email,
				updatedSupervision.lecturer.user.fullName,
				updatedSupervision.thesis.englishName,
				updatedSupervision.thesis.vietnameseName,
				updatedSupervision.thesis.abbreviation,
				updatedSupervision.thesis.domain ?? undefined,
				'assigned',
			);

			return updatedSupervision;
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

			const existingSupervision = await this.prisma.supervision.findFirst({
				where: {
					thesisId,
					lecturerId,
				},
			});

			if (!existingSupervision) {
				this.logger.error(
					`Supervision for thesis ${thesisId} with lecturer ${lecturerId} does not exist`,
				);
				throw new NotFoundException(
					`Supervision for thesis ${thesisId} with lecturer ${lecturerId} does not exist`,
				);
			}

			const currentSupervisionsCount = await this.prisma.supervision.count({
				where: { thesisId },
			});

			if (currentSupervisionsCount <= 1) {
				this.logger.warn(
					`Cannot remove supervisor: thesis ${thesisId} must have at least 1 supervisor`,
				);
				throw new BadRequestException(
					`Cannot remove supervisor: thesis ${thesisId} must have at least 1 supervisor`,
				);
			}

			// Lấy thông tin lecturer và thesis trước khi xóa
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

			// Gửi email thông báo cho lecturer bị xóa
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

			return { message: 'Supervision removed successfully' };
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

			const supervisions = await this.prisma.supervision.groupBy({
				where: { thesisId },
				by: ['lecturerId'],
			});

			this.logger.log(
				`Found ${supervisions.length} supervisions for thesis ${thesisId}`,
			);

			const lecturerIds = supervisions.map((s) => s.lecturerId);

			const lecturers = await this.prisma.lecturer.findMany({
				where: {
					userId: { in: lecturerIds },
				},
				select: {
					user: { select: { email: true, fullName: true, phoneNumber: true } },
					userId: true,
				},
			});

			const result = supervisions.map((supervision) => {
				const lecturer = lecturers.find(
					(l) => l.userId === supervision.lecturerId,
				);
				return {
					...supervision,
					email: lecturer?.user.email,
					fullName: lecturer?.user.fullName,
					phoneNumber: lecturer?.user.phoneNumber,
				};
			});

			return result;
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

			const supervisions = await this.prisma.supervision.groupBy({
				where: { lecturerId },
				by: ['thesisId'],
			});

			this.logger.log(
				`Found ${supervisions.length} supervisions for lecturer ${lecturerId}`,
			);

			const thesisIds = supervisions.map((s) => s.thesisId);

			const theses = await this.prisma.thesis.findMany({
				where: {
					id: { in: thesisIds },
				},
				select: {
					id: true,
					group: {
						select: {
							id: true,
						},
					},
				},
			});

			const result = supervisions.map((supervision) => {
				const thesis = theses.find((t) => t.id === supervision.thesisId);
				return {
					...supervision,
					group: thesis?.group
						? {
								id: thesis.group.id,
							}
						: null,
				};
			});

			return result;
		} catch (error) {
			this.logger.error(
				`Failed to get supervisions for lecturer ${lecturerId}`,
				error,
			);
			throw error;
		}
	}
}
