import { ConflictException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';
import { UpdateSemesterDto } from '@/semesters/dto';

import {
	EnrollmentStatus,
	OngoingPhase,
	Semester,
	SemesterStatus,
	ThesisStatus,
} from '~/generated/prisma';

@Injectable()
export class SemesterStatusService {
	private readonly logger = new Logger(SemesterStatusService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Validate khi chuyển ongoingPhase từ ScopeAdjustable sang ScopeLocked:
	 * tất cả group phải pick thesis
	 */
	async validateOngoingPhaseTransition__ScopeAdjustable_To_ScopeLocked(
		semester: Semester,
	): Promise<void> {
		const groupsWithoutThesisCount = await this.prisma.group.count({
			where: {
				semesterId: semester.id,
				thesisId: null,
			},
		});
		if (groupsWithoutThesisCount > 0) {
			const message = `Cannot transition ongoingPhase from ScopeAdjustable to ScopeLocked. There are ${groupsWithoutThesisCount} groups that have not picked a thesis.`;
			this.logger.warn(message);
			throw new ConflictException(message);
		}
		this.logger.log(
			'OngoingPhase transition ScopeAdjustable -> ScopeLocked validation passed. All groups have picked theses.',
		);
	}

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
	}

	// ------------------------------------------------------------------------------------------
	// Update
	// ------------------------------------------------------------------------------------------

	ensureUpdatableStatus(semester: Semester): void {
		if (semester.status === SemesterStatus.End) {
			this.logger.warn(
				`Cannot update semester with ID ${semester.id}: semester has already ended`,
			);

			throw new ConflictException(`Cannot update, semester has already ended`);
		}
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

		const maxGroup = semester.maxGroup;
		if (!maxGroup || maxGroup <= 0) {
			const message = `Cannot transition from ${SemesterStatus.Preparing} to ${SemesterStatus.Picking}. maxGroup is not set or invalid.`;
			this.logger.warn(message);
			throw new ConflictException(message);
		}

		const approvedPublicThesisCount = await this.prisma.thesis.count({
			where: {
				semesterId: semester.id,
				status: ThesisStatus.Approved,
				isPublish: true,
			},
		});

		if (approvedPublicThesisCount < maxGroup) {
			const message = `Cannot transition from ${SemesterStatus.Preparing} to ${SemesterStatus.Picking}. Approved & public thesis count (${approvedPublicThesisCount}) is less than maxGroup (${maxGroup}).`;
			this.logger.warn(message);
			throw new ConflictException(message);
		}

		// Validate: không có group nào có số lượng members < 4
		const groupsWithFewMembers = await this.prisma.group.findMany({
			where: { semesterId: semester.id },
			select: {
				id: true,
				code: true,
				_count: {
					select: { studentGroupParticipations: true },
				},
			},
		});
		const invalidGroups = groupsWithFewMembers.filter(
			(g) => g._count.studentGroupParticipations < 4,
		);
		if (invalidGroups.length > 0) {
			const groupCodes = invalidGroups.map((g) => g.code).join(', ');
			const message = `Cannot transition from ${SemesterStatus.Preparing} to ${SemesterStatus.Picking}. The following groups have less than 4 members: ${groupCodes}`;
			this.logger.warn(message);
			throw new ConflictException(message);
		}

		this.logger.log(
			`${SemesterStatus.Preparing} to ${SemesterStatus.Picking} transition validation passed. All students have groups, approved public thesis count is sufficient, and all groups have at least 4 members.`,
		);
	}

	async validateStatusTransition__Picking_To_Ongoing(
		semester: Semester,
		dto: UpdateSemesterDto,
	): Promise<void> {
		const currentMaxGroup = dto.maxGroup ?? semester.maxGroup;

		if (!currentMaxGroup) {
			this.logger.warn(
				`Cannot transition from ${SemesterStatus.Picking} to ${SemesterStatus.Ongoing}. maxGroup is not set.`,
			);

			throw new ConflictException(
				`Cannot transition from ${SemesterStatus.Picking} to ${SemesterStatus.Ongoing}. Please set maxGroup first.`,
			);
		}

		const groupsWithoutThesisCount = await this.prisma.group.count({
			where: {
				semesterId: semester.id,
				thesisId: null,
			},
		});

		if (groupsWithoutThesisCount > 0) {
			const message = `Cannot transition from ${SemesterStatus.Picking} to ${SemesterStatus.Ongoing}. There are ${groupsWithoutThesisCount} groups that have not picked a thesis.`;
			this.logger.warn(message);
			throw new ConflictException(message);
		}

		this.logger.log(
			`${SemesterStatus.Picking} to ${SemesterStatus.Ongoing} transition validation passed. All students have groups and picked theses.`,
		);
	}

	async validateStatusTransition___Ongoing_To_End(
		semester: Semester,
	): Promise<void> {
		if (semester.ongoingPhase !== OngoingPhase.ScopeLocked) {
			this.logger.warn(
				`Cannot transition from ${SemesterStatus.Ongoing} to ${SemesterStatus.End}. Ongoing phase is not locked.`,
			);

			throw new ConflictException(
				`Cannot transition from ${SemesterStatus.Ongoing} to ${SemesterStatus.End}. Please lock the ongoing phase first.`,
			);
		}

		const studentsWithIncompleteEnrollmentCount =
			await this.prisma.student.count({
				where: {
					enrollments: {
						some: {
							semesterId: semester.id,
							status: {
								in: [EnrollmentStatus.NotYet, EnrollmentStatus.Ongoing],
							},
						},
					},
				},
			});

		if (studentsWithIncompleteEnrollmentCount > 0) {
			const message = `Cannot transition from ${SemesterStatus.Ongoing} to ${SemesterStatus.End}. ${studentsWithIncompleteEnrollmentCount} students have incomplete enrollments.`;

			this.logger.warn(message);

			throw new ConflictException(message);
		}

		this.logger.log(
			`${SemesterStatus.Ongoing} to ${SemesterStatus.End} transition validation passed. All students have groups.`,
		);
	}

	async validateStatusTransition(
		semester: Semester,
		dto: UpdateSemesterDto,
	): Promise<void> {
		if (!dto.status) {
			return;
		}

		const statusOrder = [
			SemesterStatus.NotYet,
			SemesterStatus.Preparing,
			SemesterStatus.Picking,
			SemesterStatus.Ongoing,
			SemesterStatus.End,
		];

		const currentIndex = statusOrder.indexOf(semester.status);
		const newIndex = statusOrder.indexOf(dto.status);

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

		// Validate: tất cả thesis public phải có đủ 2 supervisor khi chuyển trạng thái
		if (
			(currentStatus === SemesterStatus.Preparing &&
				newStatus === SemesterStatus.Picking) ||
			(currentStatus === SemesterStatus.Picking &&
				newStatus === SemesterStatus.Ongoing)
		) {
			await this.ensureAllPublicThesesHaveTwoSupervisors(semester.id);
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
			await this.validateStatusTransition__Picking_To_Ongoing(semester, dto);
		}

		// Check if move from Ongoing to End
		if (
			currentStatus === SemesterStatus.Ongoing &&
			newStatus === SemesterStatus.End
		) {
			await this.validateStatusTransition___Ongoing_To_End(semester);
		}

		this.logger.log(
			`Status transition validation passed: ${currentStatus} -> ${newStatus}`,
		);
	}
	/**
	 * Đảm bảo tất cả thesis public trong semester phải có đủ 2 supervisor
	 */
	private async ensureAllPublicThesesHaveTwoSupervisors(
		semesterId: string,
	): Promise<void> {
		const theses = await this.prisma.thesis.findMany({
			where: {
				semesterId,
				isPublish: true,
			},
			select: {
				id: true,
				englishName: true,
				vietnameseName: true,
				supervisions: true,
			},
		});

		const notEnoughSupervisors = theses.filter(
			(thesis) => thesis.supervisions.length !== 2,
		);

		if (notEnoughSupervisors.length > 0) {
			const thesisNames = notEnoughSupervisors
				.map((t) => `${t.englishName || t.vietnameseName}`)
				.join(', ');
			this.logger.warn(
				`Some public theses in semester ${semesterId} do not have exactly 2 supervisors: ${thesisNames}`,
			);
			throw new ConflictException(
				`All public theses in the semester must be assigned exactly 2 supervisors. The following theses do not meet this requirement: ${thesisNames}`,
			);
		}
	}

	async validateMaxGroup(
		semester: Semester,
		dto: UpdateSemesterDto,
	): Promise<void> {
		const statusToCheck = dto.status ?? semester.status;
		if (statusToCheck !== SemesterStatus.Preparing) {
			this.logger.warn(
				`Cannot update maxGroup when status is ${statusToCheck}`,
			);
			throw new ConflictException(
				`Maximum number of Groups can only be updated when status is ${SemesterStatus.Preparing}`,
			);
		}
		// Nếu có update maxGroup thì kiểm tra số lượng group hiện tại
		if (dto.maxGroup) {
			const groupCount = await this.prisma.group.count({
				where: { semesterId: semester.id },
			});
			if (dto.maxGroup < groupCount) {
				this.logger.warn(
					`Cannot set maxGroup (${dto.maxGroup}) < current group count (${groupCount}) in semester ${semester.id}`,
				);
				throw new ConflictException(
					`Maximum number of Groups cannot be less than the current number of groups (${groupCount}) in this semester`,
				);
			}
		}
		this.logger.log(
			`Max group validation passed for semester with ID ${semester.id}`,
		);
	}

	async validateMaxThesesPerLecturer(
		semester: Semester,
		dto: UpdateSemesterDto,
	): Promise<void> {
		const statusToCheck = dto.status ?? semester.status;
		if (statusToCheck !== SemesterStatus.Preparing) {
			this.logger.warn(
				`Cannot update maxThesesPerLecturer when status is ${statusToCheck}`,
			);
			throw new ConflictException(
				`Max Theses Per Lecturer can only be updated when status is ${SemesterStatus.Preparing}`,
			);
		}
		if (dto.maxThesesPerLecturer) {
			// Tìm số lượng thesis lớn nhất mà một lecturer đã tạo trong semester này
			const result = await this.prisma.thesis.groupBy({
				by: ['lecturerId'],
				where: { semesterId: semester.id },
				_count: { id: true },
			});
			const maxThesisCount =
				result.length > 0 ? Math.max(...result.map((r) => r._count.id)) : 0;
			if (dto.maxThesesPerLecturer < maxThesisCount) {
				this.logger.warn(
					`Cannot set maxThesesPerLecturer (${dto.maxThesesPerLecturer}) < current max thesis count per lecturer (${maxThesisCount}) in semester ${semester.id}`,
				);
				throw new ConflictException(
					`Max Theses Per Lecturer cannot be less than the current maximum number of theses created by a lecturer (${maxThesisCount}) in this semester`,
				);
			}
		}
		this.logger.log(
			`Max Theses Per Lecturer validation passed for semester with ID ${semester.id}`,
		);
	}

	validateOngoingPhase(semester: Semester): void {
		if (semester.status !== SemesterStatus.Ongoing) {
			this.logger.warn(
				`Cannot update ongoingPhase when status is ${semester.status}`,
			);

			throw new ConflictException(
				`Ongoing phase can only be updated when status is ${SemesterStatus.Ongoing}`,
			);
		}

		this.logger.log(
			`Ongoing phase validation passed for semester with ID ${semester.id}`,
		);
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

		// Không cho phép chuyển từ Picking sang Ongoing mà phase là ScopeLocked
		if (
			semester.status === SemesterStatus.Picking &&
			dto.status === SemesterStatus.Ongoing &&
			dto.ongoingPhase === OngoingPhase.ScopeLocked
		) {
			this.logger.warn(
				'Cannot update from Picking to Ongoing with phase ScopeLocked. Must go through ScopeAdjustable first.',
			);
			throw new ConflictException(
				'Cannot update from Picking to Ongoing with phase Scope Locked. Must go through Scope Adjustable first.',
			);
		}

		// Chỉ cho phép update các trường liên quan khi status là Preparing
		const statusToCheck = dto.status ?? semester.status;
		const updatingFields = [
			'maxGroup',
			'defaultThesesPerLecturer',
			'maxThesesPerLecturer',
		];
		for (const field of updatingFields) {
			if (
				dto[field] !== undefined &&
				statusToCheck !== SemesterStatus.Preparing
			) {
				this.logger.warn(
					`Cannot update ${field} when status is ${statusToCheck}`,
				);
				throw new ConflictException(
					`${field} can only be updated when status is ${SemesterStatus.Preparing}`,
				);
			}
		}

		if (dto.maxGroup !== undefined) {
			await this.validateMaxGroup(semester, dto);
		}
		if (dto.maxThesesPerLecturer !== undefined) {
			await this.validateMaxThesesPerLecturer(semester, dto);
		}
		// Validate chuyển ongoingPhase từ ScopeAdjustable sang ScopeLocked
		if (
			dto.ongoingPhase === OngoingPhase.ScopeLocked &&
			semester.ongoingPhase === OngoingPhase.ScopeAdjustable &&
			semester.status === SemesterStatus.Ongoing
		) {
			await this.validateOngoingPhaseTransition__ScopeAdjustable_To_ScopeLocked(
				semester,
			);
		}
		// Chỉ validateOngoingPhase nếu KHÔNG đồng thời chuyển status từ Picking sang Ongoing
		if (
			dto.ongoingPhase &&
			!(
				semester.status === SemesterStatus.Picking &&
				dto.status === SemesterStatus.Ongoing
			)
		) {
			this.validateOngoingPhase(semester);
		}
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
