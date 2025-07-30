import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { UpdateEnrollmentsDto } from '@/semesters/dto';

import { OngoingPhase, Semester, SemesterStatus } from '~/generated/prisma';

@Injectable()
export class SemesterEnrollmentService {
	private readonly logger = new Logger(SemesterEnrollmentService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findGroups(semesterId: string) {
		this.logger.log(`Finding groups for semester ID: ${semesterId}`);
		try {
			const groups = await this.prisma.group.findMany({
				where: { semesterId },
				include: {
					studentGroupParticipations: {
						include: {
							student: {
								include: {
									major: true,
									user: true,
									enrollments: {
										where: { semesterId },
									},
								},
							},
						},
					},
					thesis: {
						include: {
							supervisions: {
								include: {
									lecturer: {
										include: { user: true },
									},
								},
							},
						},
					},
				},
			});
			return groups;
		} catch (error) {
			this.logger.error(
				`Failed to find groups for semester ID: ${semesterId}`,
				error,
			);
			throw new NotFoundException(
				`Groups for semester ID ${semesterId} not found`,
			);
		}
	}

	async update(id: string, dto: UpdateEnrollmentsDto) {
		this.logger.log(`Updating enrollments for semester ID: ${id}`);

		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id: id },
			});

			this.logger.debug(`Found semester: ${JSON.stringify(semester)}`);

			this.validateSemesterExists(semester);
			await this.validateOtherSemestersStatus(id);

			const result = await this.prisma.enrollment.updateMany({
				where: {
					studentId: { in: dto.studentIds },
					semesterId: id,
				},
				data: {
					status: dto.status,
				},
			});

			this.logger.log(
				`Updated ${result.count} enrollments for semester ID: ${id}`,
			);

			return result;
		} catch (error) {
			this.logger.error(
				`Failed to update enrollments for semester ID: ${id}`,
				error,
			);

			throw error;
		}
	}

	private validateSemesterExists(semester: Semester | null) {
		if (!semester) {
			const message = 'Semester not found';
			this.logger.warn(message);

			throw new NotFoundException(message);
		}

		if (
			semester.status !== SemesterStatus.Ongoing ||
			semester.ongoingPhase !== 'ScopeLocked'
		) {
			this.logger.warn(
				`Cannot update enrollments for semester ${semester.id}: status is ${semester.status}, must be ${SemesterStatus.Ongoing}`,
			);

			throw new ConflictException(
				`Cannot update enrollments: semester status must be ${SemesterStatus.Ongoing} & phase must be Scope Locked`,
			);
		}
	}

	private async validateOtherSemestersStatus(
		currentSemesterId: string,
	): Promise<void> {
		this.logger.log(
			`Validating other semesters status for current semester: ${currentSemesterId}`,
		);

		const otherSemesters = await this.prisma.semester.findMany({
			where: {
				id: { not: currentSemesterId },
			},
		});

		for (const semester of otherSemesters) {
			// Tất cả các kỳ khác phải có status là NotYet hoặc End
			if (
				semester.status !== SemesterStatus.NotYet &&
				semester.status !== SemesterStatus.End
			) {
				// Nếu có kỳ khác đang Ongoing, thì phase phải là ScopeLocked
				if (semester.status === SemesterStatus.Ongoing) {
					if (semester.ongoingPhase !== OngoingPhase.ScopeLocked) {
						this.logger.warn(
							`Cannot update enrollments. Other semester ${semester.id} is in ${semester.status} status with phase ${semester.ongoingPhase}, but phase must be ScopeLocked`,
						);

						throw new ConflictException(
							`Cannot update enrollments. Other semester (${semester.name}) is in ${semester.status} status with phase ${semester.ongoingPhase}. Phase must be Scope Locked to allow enrollment updates.`,
						);
					}
				} else {
					// Các trạng thái khác (Preparing, Picking) không được phép
					this.logger.warn(
						`Cannot update enrollments. Other semester ${semester.id} is in ${semester.status} status`,
					);

					throw new ConflictException(
						`Cannot update enrollments. Other semester (${semester.name}) is in ${semester.status} status. Only semesters with NotYet, End, or Ongoing (ScopeLocked) status are allowed.`,
					);
				}
			}
		}

		this.logger.log(
			`Other semesters status validation passed for semester: ${currentSemesterId}`,
		);
	}
}
