import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import {
	AssignBulkSupervisionDto,
	ChangeSupervisionDto,
} from '@/supervisions/dtos';
import {
	AssignmentStatus,
	SupervisionService,
} from '@/supervisions/services/supervision.service';

import { ThesisStatus } from '~/generated/prisma';

@Injectable()
export class SupervisionModeratorService {
	private readonly logger = new Logger(SupervisionModeratorService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly supervisionService: SupervisionService,
	) {}

	async assignBulkSupervisor(dto: AssignBulkSupervisionDto) {
		const thesisIds = dto.assignments.map((a) => a.thesisId);

		const theses = await this.prisma.thesis.findMany({
			where: { id: { in: thesisIds } },
			select: {
				id: true,
				englishName: true,
				status: true,
				semester: true,
			},
		});

		const notApproved = theses.filter(
			(t) => t.status !== ThesisStatus.Approved,
		);
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

		const invalidSemester = theses.filter(
			(t) =>
				!t.semester ||
				(t.semester.status !== 'Preparing' && t.semester.status !== 'Picking'),
		);
		if (invalidSemester.length > 0) {
			const thesisNames = invalidSemester
				.map(function (t) {
					return t.englishName ? t.englishName : t.id;
				})
				.join(', ');
			const errorMessage =
				'Supervisors can only be assigned when the semester is in Preparing or Picking. The following theses do not meet this requirement: ' +
				thesisNames;
			throw new BadRequestException(errorMessage);
		}

		const invalidAssignments = dto.assignments.filter(
			(a) => !a.lecturerIds || a.lecturerIds.length !== 2,
		);
		if (invalidAssignments.length > 0) {
			const thesisNames = invalidAssignments
				.map((a) => {
					const thesis = theses.find((t) => t.id === a.thesisId);
					return thesis?.englishName;
				})
				.join(', ');
			throw new BadRequestException(
				`Each thesis must be assigned exactly 2 lecturers. The following thesis do not meet this requirement: ${thesisNames}`,
			);
		}

		for (const assignment of dto.assignments) {
			const { thesisId } = assignment;

			const oldSupervisions = await this.prisma.supervision.findMany({
				where: { thesisId },
				select: { thesisId: true, lecturerId: true },
			});
			if (oldSupervisions.length > 0) {
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
			await this.supervisionService.processAssignment(assignment, results);
		}

		return results;
	}

	async changeSupervisor(thesisId: string, dto: ChangeSupervisionDto) {
		try {
			this.logger.log(
				`Updating supervision for thesis ${thesisId} from lecturer ${dto.currentSupervisorId} to lecturer ${dto.newSupervisorId}`,
			);

			const existingSupervision =
				await this.supervisionService.checkExistingSupervision(
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

			await this.supervisionService.validateLecturer(
				dto.newSupervisorId,
				'New lecturer',
			);

			const newLecturerSupervision =
				await this.supervisionService.checkExistingSupervision(
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

			this.logger.debug('No cache invalidation needed for supervision change');

			const oldLecturer = await this.prisma.lecturer.findUnique({
				where: { userId: dto.currentSupervisorId },
				include: { user: true },
			});

			if (oldLecturer) {
				await this.supervisionService.sendSupervisionNotificationEmail(
					oldLecturer.user.email,
					oldLecturer.user.fullName,
					updatedSupervision.thesis.englishName,
					updatedSupervision.thesis.vietnameseName,
					updatedSupervision.thesis.abbreviation,
					updatedSupervision.thesis.domain ?? undefined,
					'removed',
				);
			}

			await this.supervisionService.sendSupervisionNotificationEmail(
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

			const existingSupervision =
				await this.supervisionService.checkExistingSupervision(
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

			const currentSupervisionsCount =
				await this.supervisionService.getSupervisionCount(thesisId);

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

			if (supervisionToDelete) {
				await this.supervisionService.sendSupervisionNotificationEmail(
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
}
