import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailJobDto } from '@/queue/email/dto/email-job.dto';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';

export type AssignmentStatus =
	| 'success'
	| 'already_exists'
	| 'max_supervisors_reached'
	| 'error';

@Injectable()
export class SupervisionService {
	private readonly logger = new Logger(SupervisionService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly emailQueueService: EmailQueueService,
	) {}

	async processAssignment(
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

	async processLecturerAssignment(
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

	async validateLecturer(lecturerId: string, context = 'Lecturer') {
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

	async checkExistingSupervision(thesisId: string, lecturerId: string) {
		return this.prisma.supervision.findFirst({
			where: { thesisId, lecturerId },
		});
	}

	async getSupervisionCount(thesisId: string) {
		return this.prisma.supervision.count({
			where: { thesisId },
		});
	}

	async sendSupervisionNotificationEmail(
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
}
