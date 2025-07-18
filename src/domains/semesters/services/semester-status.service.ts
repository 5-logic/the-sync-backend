import { UpdateSemesterDto } from '../dto';
import { ConflictException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';

import {
	EnrollmentStatus,
	OngoingPhase,
	Semester,
	SemesterStatus,
} from '~/generated/prisma';

@Injectable()
export class SemesterStatusService {
	private readonly logger = new Logger(SemesterStatusService.name);

	constructor(private readonly prisma: PrismaService) {}

	// ------------------------------------------------------------------------------------------
	// Create
	// ------------------------------------------------------------------------------------------

	async ensureNoActiveSemester(): Promise<void> {
		const activeSemester = await this.prisma.semester.findFirst({
			where: {
				status: {
					notIn: [SemesterStatus.NotYet, SemesterStatus.End],
				},
			},
		});

		if (activeSemester) {
			this.logger.warn(
				`Cannot create semester. Active semester found with ID: ${activeSemester.id}, status: ${activeSemester.status}`,
			);

			throw new ConflictException(
				`Cannot create new semester. There is already an active semester (${activeSemester.name}) with status: ${activeSemester.status}`,
			);
		}

		return;
	}

	// ------------------------------------------------------------------------------------------
	// Delete
	// ------------------------------------------------------------------------------------------

	ensureDeletableStatus(semester: Semester): void {
		if (semester.status !== SemesterStatus.NotYet) {
			this.logger.warn(
				`Cannot delete semester ${semester.id}: status = ${semester.status}`,
			);

			throw new ConflictException(
				`Only semesters with status "${SemesterStatus.NotYet}" can be deleted.`,
			);
		}

		return;
	}

	// ------------------------------------------------------------------------------------------
	// Update
	// ------------------------------------------------------------------------------------------

	ensureUpdatableStatus(semester: Semester): void {
		if (semester.status !== SemesterStatus.End) {
			this.logger.warn(
				`Cannot update semester with ID ${semester.id}: semester has already ended`,
			);

			throw new ConflictException(
				`Only semesters with status "${SemesterStatus.End}" can be updated.`,
			);
		}

		return;
	}

	async validateStatusTransition__Preparing_To_Picking(
		semester: Semester,
	): Promise<void> {
		const studentsWithoutGroupCount = await this.prisma.student.count({
			where: {
				enrollments: {
					some: { semesterId: semester.id, status: EnrollmentStatus.NotYet },
				},
				studentGroupParticipations: {
					none: {
						semesterId: semester.id,
					},
				},
			},
		});

		if (studentsWithoutGroupCount > 0) {
			const message = `Cannot transition from ${SemesterStatus.Preparing} to ${SemesterStatus.Picking}. ${studentsWithoutGroupCount} students do not have groups.`;

			this.logger.warn(message);

			throw new ConflictException(message);
		}

		this.logger.log(
			`${SemesterStatus.Preparing} to ${SemesterStatus.Picking} transition validation passed. All students have groups.`,
		);

		return;
	}

	validateStatusTransition__Picking_To_Ongoing(
		semester: Semester,
		dto: UpdateSemesterDto,
	): void {
		const currentMaxGroup = dto.maxGroup ?? semester.maxGroup;

		if (!currentMaxGroup) {
			this.logger.warn(
				`Cannot transition from ${SemesterStatus.Picking} to ${SemesterStatus.Ongoing}. maxGroup is not set.`,
			);

			throw new ConflictException(
				`Cannot transition from ${SemesterStatus.Picking} to ${SemesterStatus.Ongoing}. Please set maxGroup first.`,
			);
		}

		return;
	}

	validateStatusTransition___Ongoing_To_End(
		semester: Semester,
		dto: UpdateSemesterDto,
	): Promise<void> {
		if (
			semester.status === SemesterStatus.Ongoing &&
			dto.status === SemesterStatus.End
		) {
			this.logger.log(
				`Validating transition from Ongoing to End for semester with ID ${semester.id}`,
			);
			return;
		}

		this.logger.warn(
			`Invalid status transition from ${semester.status} to ${dto.status}`,
		);

		throw new ConflictException(
			`Invalid status transition. Can only move from ${SemesterStatus.Ongoing} to ${SemesterStatus.End}`,
		);
	}

	async validateStatusTransition(
		semester: Semester,
		dto: UpdateSemesterDto,
	): Promise<void> {
		const statusOrder = [
			SemesterStatus.NotYet,
			SemesterStatus.Preparing,
			SemesterStatus.Picking,
			SemesterStatus.Ongoing,
			SemesterStatus.End,
		];

		const currentIndex = statusOrder.indexOf(semester.status);
		const newIndex = statusOrder.indexOf(dto.status!);

		const currentStatus = statusOrder[currentIndex];
		const newStatus = statusOrder[newIndex];

		// Check if the new status is valid
		if (newIndex !== currentIndex + 1 && newIndex !== currentIndex) {
			this.logger.warn(
				`Invalid status transition from ${currentStatus} to ${newStatus}`,
			);

			throw new ConflictException(
				`Invalid status transition. Can only move from ${currentStatus} to ${statusOrder[currentIndex + 1] ?? 'nowhere'}`,
			);
		}

		// Check if move from Preparing to Picking
		if (
			currentStatus === SemesterStatus.Preparing &&
			newStatus === SemesterStatus.Picking
		) {
			await this.validateStatusTransition__Preparing_To_Picking(semester);
		}

		// Check if move from Picking to Ongoing
		if (
			currentStatus === SemesterStatus.Picking &&
			newStatus === SemesterStatus.Ongoing
		) {
			this.validateStatusTransition__Picking_To_Ongoing(semester, dto);
		}

		// Check if move from Ongoing to End
		if (
			currentStatus === SemesterStatus.Ongoing &&
			newStatus === SemesterStatus.End
		) {
			await this.validateStatusTransition___Ongoing_To_End(semester, dto);
		}

		this.logger.log(
			`Status transition validation passed: ${currentStatus} -> ${newStatus}`,
		);
	}

	validateMaxGroup(semester: Semester, dto: UpdateSemesterDto): void {
		const statusToCheck = dto.status ?? semester.status;

		if (statusToCheck !== SemesterStatus.Preparing) {
			this.logger.warn(
				`Cannot update maxGroup when status is ${statusToCheck}`,
			);

			throw new ConflictException(
				`maxGroup can only be updated when status is ${SemesterStatus.Preparing}`,
			);
		}

		this.logger.log(
			`Max group validation passed for semester with ID ${semester.id}`,
		);

		return;
	}

	validateOngoingPhase(semester: Semester, dto: UpdateSemesterDto): void {
		if (semester.status !== SemesterStatus.Ongoing) {
			this.logger.warn(
				`Cannot update ongoingPhase when status is ${semester.status}`,
			);

			throw new ConflictException(
				`ongoingPhase can only be updated when status is ${SemesterStatus.Ongoing}`,
			);
		}

		this.logger.log(
			`Ongoing phase validation passed for semester with ID ${semester.id}`,
		);

		return;
	}

	async validateSemesterUpdate(
		semester: Semester,
		dto: UpdateSemesterDto,
	): Promise<void> {
		this.logger.log(`Validating update for semester with ID ${semester.id}`);

		this.ensureUpdatableStatus(semester);

		if (dto.status && dto.status !== semester.status) {
			await this.validateStatusTransition(semester, dto);
		}

		if (dto.maxGroup) {
			this.validateMaxGroup(semester, dto);
		}

		if (dto.ongoingPhase) {
			this.validateOngoingPhase(semester, dto);
		}

		return;
	}

	prepareUpdateData(
		semester: Semester,
		dto: UpdateSemesterDto,
	): UpdateSemesterDto {
		const data: UpdateSemesterDto = dto;

		if (
			semester.status === SemesterStatus.Picking &&
			dto.status === SemesterStatus.Ongoing
		) {
			data.ongoingPhase = OngoingPhase.ScopeAdjustable;

			this.logger.debug(
				`Auto-setting ongoingPhase to ${OngoingPhase.ScopeAdjustable}`,
			);
		}

		return data;
	}
}
