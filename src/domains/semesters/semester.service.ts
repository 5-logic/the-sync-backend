import {
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import {
	CreateSemesterDto,
	UpdateEnrollmentsDto,
	UpdateSemesterDto,
} from '@/semesters/dto';

import {
	EnrollmentStatus,
	OngoingPhase,
	SemesterStatus,
} from '~/generated/prisma';

@Injectable()
export class SemesterService {
	private readonly logger = new Logger(SemesterService.name);

	private static readonly CACHE_KEY = 'cache:semester';

	constructor(
		private readonly prisma: PrismaService,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
	) {}

	async create(dto: CreateSemesterDto) {
		try {
			this.logger.log('Starting semester creation process');

			const conflictSemester = await this.prisma.semester.findFirst({
				where: {
					OR: [{ name: dto.name }, { code: dto.code }],
				},
			});

			if (conflictSemester) {
				const field = conflictSemester.name === dto.name ? 'name' : 'code';
				this.logger.warn(`Duplicate ${field}: ${dto[field]}`);

				throw new ConflictException(
					`Semester with this ${field} already exists`,
				);
			}

			this.logger.debug('Name and code validation passed');

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

			this.logger.debug('Active semester validation passed');

			const newSemester = await this.prisma.semester.create({
				data: {
					code: dto.code,
					name: dto.name,
					maxGroup: dto.maxGroup,
					defaultThesesPerLecturer: dto.defaultThesesPerLecturer,
					maxThesesPerLecturer: dto.maxThesesPerLecturer,
				},
			});

			this.logger.log(
				`Semester created successfully with ID: ${newSemester.id}`,
			);
			this.logger.debug('New semester details', newSemester);

			// Clear cache after creating new semester - only clear individual caches
			// No need to clear findAll cache as it's no longer cached

			return newSemester;
		} catch (error) {
			this.logger.error('Error creating semester', error);

			throw error;
		}
	}

	/**
	 * Get all semesters - no caching for real-time updates
	 */
	async findAll() {
		try {
			const semesters = await this.prisma.semester.findMany({
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${semesters.length} semesters`);

			return semesters;
		} catch (error) {
			this.logger.error('Error fetching semesters:', error);
			throw error;
		}
	}

	/**
	 * Get semester by ID - cache with TTL for performance
	 */
	async findOne(id: string) {
		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!semester) {
				throw new NotFoundException(`Semester not found`);
			}

			this.logger.log(`Semester found with ID: ${semester.id}`);

			return semester;
		} catch (error) {
			this.logger.error('Error fetching semester:', error);
			throw error;
		}
	}

	async update(id: string, dto: UpdateSemesterDto) {
		try {
			this.logger.log(`Starting semester update process for ID: ${id}`);

			const existingSemester = await this.findExistingSemester(id);

			this.validateSemesterUpdatePermissions(existingSemester);
			await this.performUpdateValidations(existingSemester, dto);

			const updateData = this.prepareUpdateData(existingSemester, dto);

			const updatedSemester = await this.prisma.semester.update({
				where: { id },
				data: updateData,
			});

			// Handle enrollment status update and email notifications when status changes to Ongoing
			if (
				existingSemester.status === SemesterStatus.Picking &&
				dto.status === SemesterStatus.Ongoing
			) {
				await this.handleSemesterOngoingTransition(updatedSemester);
			}

			this.logger.log(
				`Semester updated successfully with ID: ${updatedSemester.id}`,
			);
			this.logger.debug('Updated semester details', updatedSemester);

			return updatedSemester;
		} catch (error) {
			this.logger.error('Error updating semester', error);
			throw error;
		}
	}

	async remove(id: string) {
		try {
			this.logger.log(`Starting semester removal process for ID: ${id}`);

			const existingSemester = await this.prisma.semester.findUnique({
				where: { id },
				include: {
					groups: true,
					enrollments: true,
					milestones: true,
					studentGroupParticipations: true,
				},
			});

			if (!existingSemester) {
				this.logger.warn(`Semester with ID ${id} not found for removal`);

				throw new NotFoundException(`Semester not found`);
			}

			this.logger.debug('Existing semester found', existingSemester);

			if (existingSemester.status !== SemesterStatus.NotYet) {
				this.logger.warn(
					`Cannot delete semester with ID ${id}: status is ${existingSemester.status}, must be ${SemesterStatus.NotYet}`,
				);

				throw new ConflictException(
					`Cannot delete semester: status must be ${SemesterStatus.NotYet}`,
				);
			}

			const hasRelationships =
				existingSemester.groups.length > 0 ||
				existingSemester.enrollments.length > 0 ||
				existingSemester.milestones.length > 0 ||
				existingSemester.studentGroupParticipations.length > 0;

			if (hasRelationships) {
				this.logger.warn(
					`Cannot delete semester with ID ${id}: semester has existing relationships`,
				);

				throw new ConflictException(
					`Cannot delete semester: semester has existing relationships`,
				);
			}

			this.logger.debug('All validation checks passed for semester removal');

			const deletedSemester = await this.prisma.semester.delete({
				where: { id },
			});

			this.logger.log(
				`Semester deleted successfully with ID: ${deletedSemester.id}`,
			);
			this.logger.debug('Deleted semester details', deletedSemester);

			return deletedSemester;
		} catch (error) {
			this.logger.error('Error removing semester', error);

			throw error;
		}
	}

	private async validatePreparingToPickingTransition(semesterId: string) {
		this.logger.debug(
			`Starting validation for Preparing to Picking transition for semester ${semesterId}`,
		);

		const studentsWithoutGroup = await this.prisma.student.findMany({
			where: {
				enrollments: {
					some: {
						semesterId: semesterId,
						status: EnrollmentStatus.NotYet,
					},
				},
				studentGroupParticipations: {
					none: {
						semesterId: semesterId,
					},
				},
			},
			include: {
				user: true,
				enrollments: {
					where: {
						semesterId: semesterId,
					},
				},
			},
		});

		this.logger.debug(
			`Found ${studentsWithoutGroup.length} students without groups in semester ${semesterId}`,
		);

		if (studentsWithoutGroup.length > 0) {
			// Log chi tiết về những students chưa có group
			const studentDetails = studentsWithoutGroup.map((student) => ({
				id: student.userId,
				email: student.user.email,
				fullName: student.user.fullName,
				enrollmentStatus: student.enrollments[0]?.status,
			}));

			this.logger.warn(
				`Cannot transition from Preparing to Picking: ${studentsWithoutGroup.length} students do not have a group.`,
				{ students: studentDetails },
			);

			throw new ConflictException(
				`Cannot transition to Picking. There are ${studentsWithoutGroup.length} students without a group: ${studentDetails.map((s) => s.fullName).join(', ')}`,
			);
		}

		this.logger.debug(
			`Preparing to Picking transition validation passed. All students have groups.`,
		);
	}

	private async validateStatusTransition(
		currentStatus: SemesterStatus,
		newStatus: SemesterStatus,
		semesterId: string,
	) {
		const statusOrder = [
			SemesterStatus.NotYet,
			SemesterStatus.Preparing,
			SemesterStatus.Picking,
			SemesterStatus.Ongoing,
			SemesterStatus.End,
		];

		const currentIndex = statusOrder.indexOf(currentStatus);
		const newIndex = statusOrder.indexOf(newStatus);

		if (newIndex !== currentIndex + 1 && newIndex !== currentIndex) {
			this.logger.warn(
				`Invalid status transition from ${currentStatus} to ${newStatus}`,
			);

			throw new ConflictException(
				`Invalid status transition. Can only move from ${currentStatus} to ${statusOrder[currentIndex + 1] ?? 'nowhere'}`,
			);
		}

		if (
			currentStatus === SemesterStatus.Preparing &&
			newStatus === SemesterStatus.Picking
		) {
			await this.validatePreparingToPickingTransition(semesterId);
		}

		this.logger.debug(
			`Status transition validation passed: ${currentStatus} -> ${newStatus}`,
		);
	}

	private validateMaxGroupUpdate(
		currentStatus: SemesterStatus,
		newStatus?: SemesterStatus,
	) {
		const allowedStatuses: SemesterStatus[] = [
			SemesterStatus.Preparing,
			SemesterStatus.Picking,
		];

		const statusToCheck = newStatus ?? currentStatus;

		if (!allowedStatuses.includes(statusToCheck)) {
			this.logger.warn(
				`Cannot update maxGroup when status is ${statusToCheck}`,
			);

			throw new ConflictException(
				`maxGroup can only be updated when status is ${SemesterStatus.Preparing} or ${SemesterStatus.Picking}`,
			);
		}

		this.logger.debug('maxGroup update validation passed');
	}

	private validatePickingToOngoingTransition(
		currentMaxGroup: number | null,
		updateDto: UpdateSemesterDto,
	) {
		const newMaxGroup = updateDto.maxGroup;

		const effectiveMaxGroup = newMaxGroup ?? currentMaxGroup;

		if (!effectiveMaxGroup) {
			this.logger.warn(
				`Cannot transition from ${SemesterStatus.Picking} to ${SemesterStatus.Ongoing}: maxGroup must be have a value greater than 0. Current: ${currentMaxGroup}, New: ${newMaxGroup}`,
			);

			throw new ConflictException(
				`Cannot transition from ${SemesterStatus.Picking} to ${SemesterStatus.Ongoing}: maxGroup must be have a value greater than 0`,
			);
		}

		this.logger.debug(
			`${SemesterStatus.Picking} to ${SemesterStatus.Ongoing} transition validation passed. Effective maxGroup: ${effectiveMaxGroup}`,
		);
	}

	private validateOngoingPhaseUpdate(
		currentStatus: SemesterStatus,
		newStatus?: SemesterStatus,
	) {
		const statusToCheck = newStatus ?? currentStatus;

		if (statusToCheck !== SemesterStatus.Ongoing) {
			this.logger.warn(
				`ongoingPhase can only be updated when status is ${SemesterStatus.Ongoing}, current/new status: ${statusToCheck}`,
			);

			throw new ConflictException(
				`ongoingPhase can only be updated when status is ${SemesterStatus.Ongoing}`,
			);
		}

		this.logger.debug('ongoingPhase update validation passed');
	}

	private validateOngoingPhaseTransition(
		currentOngoingPhase: OngoingPhase | null,
		newOngoingPhase: OngoingPhase,
	) {
		if (
			currentOngoingPhase === OngoingPhase.ScopeLocked &&
			newOngoingPhase === OngoingPhase.ScopeAdjustable
		) {
			this.logger.warn(
				`Cannot transition ongoingPhase from ${OngoingPhase.ScopeLocked} back to ${OngoingPhase.ScopeAdjustable}`,
			);

			throw new ConflictException(
				`Cannot change ongoingPhase from ${OngoingPhase.ScopeLocked} back to ${OngoingPhase.ScopeAdjustable}`,
			);
		}

		this.logger.debug(
			`ongoingPhase transition validation passed: ${currentOngoingPhase} -> ${newOngoingPhase}`,
		);
	}

	private async validateOngoingToEndTransition(
		ongoingPhase: OngoingPhase | null,
		semesterId: string,
	) {
		if (ongoingPhase !== OngoingPhase.ScopeLocked) {
			this.logger.warn(
				`Cannot transition from ${SemesterStatus.Ongoing} to ${SemesterStatus.End}: ongoingPhase must be ${OngoingPhase.ScopeLocked}, current: ${ongoingPhase}`,
			);

			throw new ConflictException(
				`Cannot transition from ${SemesterStatus.Ongoing} to ${SemesterStatus.End}: ongoingPhase must be ${OngoingPhase.ScopeLocked}`,
			);
		}

		// Validate that all students have completed their enrollment (Passed or Failed)
		const studentsWithIncompleteEnrollment = await this.prisma.student.findMany(
			{
				where: {
					enrollments: {
						some: {
							semesterId: semesterId,
							status: {
								in: [EnrollmentStatus.NotYet, EnrollmentStatus.Ongoing],
							},
						},
					},
				},
				include: {
					user: true,
					enrollments: {
						where: {
							semesterId: semesterId,
						},
					},
				},
			},
		);

		this.logger.debug(
			`Found ${studentsWithIncompleteEnrollment.length} students with incomplete enrollment in semester ${semesterId}`,
		);

		if (studentsWithIncompleteEnrollment.length > 0) {
			this.logger.warn(
				`Cannot transition from Ongoing to End: ${studentsWithIncompleteEnrollment.length} students have incomplete enrollment.`,
			);

			throw new ConflictException(
				`Cannot transition to End. There are ${studentsWithIncompleteEnrollment.length} students with incomplete enrollment (NotYet or Ongoing)`,
			);
		}

		this.logger.debug(
			`${SemesterStatus.Ongoing} to ${SemesterStatus.End} transition validation passed`,
		);
	}

	private async findExistingSemester(id: string) {
		const existingSemester = await this.prisma.semester.findUnique({
			where: { id },
		});

		if (!existingSemester) {
			this.logger.warn(`Semester with ID ${id} not found for update`);

			throw new NotFoundException(`Semester not found`);
		}

		this.logger.debug('Existing semester found', existingSemester);
		return existingSemester;
	}

	private validateSemesterUpdatePermissions(existingSemester: {
		id: string;
		status: SemesterStatus;
	}) {
		if (existingSemester.status === SemesterStatus.End) {
			this.logger.warn(
				`Cannot update semester with ID ${existingSemester.id}: semester has already ended`,
			);

			throw new ConflictException(
				'Cannot update semester. This semester has already ended',
			);
		}
	}

	private async performUpdateValidations(
		existingSemester: {
			id: string;
			status: SemesterStatus;
			maxGroup: number | null;
			ongoingPhase: OngoingPhase | null;
		},
		updateSemesterDto: UpdateSemesterDto,
	) {
		if (
			updateSemesterDto.status &&
			updateSemesterDto.status !== existingSemester.status
		) {
			await this.validateStatusTransition(
				existingSemester.status,
				updateSemesterDto.status,
				existingSemester.id, // Truyền thêm semesterId
			);
		}

		if (updateSemesterDto.maxGroup !== undefined) {
			this.validateMaxGroupUpdate(
				existingSemester.status,
				updateSemesterDto.status,
			);
		}

		await this.validatePickingToOngoingFlowAsync(
			existingSemester,
			updateSemesterDto,
		);
		this.validateOngoingPhaseFlow(existingSemester, updateSemesterDto);

		if (
			existingSemester.status === SemesterStatus.Ongoing &&
			updateSemesterDto.status === SemesterStatus.End
		) {
			await this.validateOngoingToEndTransition(
				existingSemester.ongoingPhase,
				existingSemester.id,
			);
		}
	}

	private async validatePickingToOngoingFlowAsync(
		existingSemester: {
			id: string;
			status: SemesterStatus;
			maxGroup: number | null;
		},
		updateSemesterDto: UpdateSemesterDto,
	) {
		// Check transition from Preparing to Picking: enough public theses for all groups
		if (
			existingSemester.status === SemesterStatus.Preparing &&
			updateSemesterDto.status === SemesterStatus.Picking
		) {
			// Check public thesis count >= total group count
			const [publicThesisCount, groupCount] = await Promise.all([
				this.prisma.thesis.count({
					where: {
						semesterId: existingSemester.id,
						isPublish: true,
					},
				}),
				this.prisma.group.count({
					where: {
						semesterId: existingSemester.id,
					},
				}),
			]);
			this.logger.debug(
				`Public thesis count: ${publicThesisCount}, group count: ${groupCount} in semester ${existingSemester.id}`,
			);
			if (publicThesisCount < groupCount) {
				this.logger.warn(
					`Cannot transition from Preparing to Picking: Not enough public theses. Required: ${groupCount}, Available: ${publicThesisCount}`,
				);
				throw new ConflictException(
					`Cannot transition to Picking. There are only ${publicThesisCount} public theses, but ${groupCount} groups. Please publish more theses.`,
				);
			}
		}
		// Check transition from Picking to Ongoing: all groups have picked a thesis
		if (
			existingSemester.status === SemesterStatus.Picking &&
			updateSemesterDto.status === SemesterStatus.Ongoing
		) {
			this.validatePickingToOngoingTransition(
				existingSemester.maxGroup,
				updateSemesterDto,
			);
			if (updateSemesterDto.ongoingPhase === OngoingPhase.ScopeLocked) {
				this.logger.warn(
					`Cannot transition from ${SemesterStatus.Picking} to ${SemesterStatus.Ongoing} with ongoingPhase set to ${OngoingPhase.ScopeLocked}`,
				);
				throw new ConflictException(
					`Cannot transition from ${SemesterStatus.Picking} to ${SemesterStatus.Ongoing} with ongoingPhase set to ${OngoingPhase.ScopeLocked}. ongoingPhase will be automatically set to ${OngoingPhase.ScopeAdjustable}`,
				);
			}
			// Check all groups in this semester have picked a thesis
			const groupsWithoutThesis = await this.prisma.group.findMany({
				where: {
					semesterId: existingSemester.id,
					thesisId: null,
				},
			});
			if (groupsWithoutThesis.length > 0) {
				this.logger.warn(
					`Cannot transition from Picking to Ongoing: ${groupsWithoutThesis.length} groups have not picked a thesis.`,
					{
						groups: groupsWithoutThesis.map((g) => ({
							id: g.id,
							name: g.name,
							code: g.code,
						})),
					},
				);
				throw new ConflictException(
					`Cannot transition to Ongoing. There are ${groupsWithoutThesis.length} groups without a thesis. All groups must pick a thesis before continuing.`,
				);
			}
		}
	}

	private validateOngoingPhaseFlow(
		existingSemester: {
			status: SemesterStatus;
			ongoingPhase: OngoingPhase | null;
		},
		updateSemesterDto: UpdateSemesterDto,
	) {
		if (updateSemesterDto.ongoingPhase !== undefined) {
			this.validateOngoingPhaseUpdate(
				existingSemester.status,
				updateSemesterDto.status,
			);

			if (existingSemester.ongoingPhase !== updateSemesterDto.ongoingPhase) {
				this.validateOngoingPhaseTransition(
					existingSemester.ongoingPhase,
					updateSemesterDto.ongoingPhase,
				);
			}
		}
	}

	private prepareUpdateData(
		existingSemester: { status: SemesterStatus },
		updateSemesterDto: UpdateSemesterDto,
	) {
		const updateData: any = {};

		// Explicitly define which fields can be updated
		if (updateSemesterDto.code !== undefined) {
			updateData.code = updateSemesterDto.code;
		}
		if (updateSemesterDto.name !== undefined) {
			updateData.name = updateSemesterDto.name;
		}
		if (updateSemesterDto.maxGroup !== undefined) {
			updateData.maxGroup = updateSemesterDto.maxGroup;
		}
		if (updateSemesterDto.status !== undefined) {
			updateData.status = updateSemesterDto.status;
		}
		if (updateSemesterDto.ongoingPhase !== undefined) {
			updateData.ongoingPhase = updateSemesterDto.ongoingPhase;
		}

		if (
			existingSemester.status === SemesterStatus.Picking &&
			updateSemesterDto.status === SemesterStatus.Ongoing
		) {
			updateData.ongoingPhase = OngoingPhase.ScopeAdjustable;
			this.logger.debug(
				`Auto-setting ongoingPhase to ${OngoingPhase.ScopeAdjustable}`,
			);
		}

		if (updateSemesterDto.defaultThesesPerLecturer !== undefined) {
			updateData.defaultThesesPerLecturer =
				updateSemesterDto.defaultThesesPerLecturer;
		}
		if (updateSemesterDto.maxThesesPerLecturer !== undefined) {
			updateData.maxThesesPerLecturer = updateSemesterDto.maxThesesPerLecturer;
		}

		return updateData;
	}

	private async handleSemesterOngoingTransition(semester: {
		id: string;
		name: string;
		code: string;
	}) {
		this.logger.log(
			`Handling enrollment status update for semester ${semester.id} transition to Ongoing`,
		);

		try {
			// Update all enrollments in this semester to Ongoing status
			const updateResult = await this.prisma.enrollment.updateMany({
				where: {
					semesterId: semester.id,
					status: EnrollmentStatus.NotYet, // Only update NotYet enrollments
				},
				data: {
					status: EnrollmentStatus.Ongoing,
				},
			});

			this.logger.log(
				`Updated ${updateResult.count} enrollments to Ongoing status`,
			);

			// Get all students in this semester to send notifications
			const enrollments = await this.prisma.enrollment.findMany({
				where: {
					semesterId: semester.id,
					status: EnrollmentStatus.Ongoing,
				},
				include: {
					student: {
						include: {
							user: true,
						},
					},
				},
			});

			this.logger.log(
				`Found ${enrollments.length} students to notify about semester ongoing`,
			);

			// Send email notifications to all students
			const emailPromises = enrollments.map((enrollment) => {
				return this.emailQueueService.sendEmail(
					EmailJobType.SEND_SEMESTER_ONGOING_NOTIFICATION,
					{
						to: enrollment.student.user.email,
						subject: `Announcement Semester ${semester.name} has started - TheSync`,
						context: {
							fullName: enrollment.student.user.fullName,
							semesterName: semester.name,
							semesterCode: semester.code,
						},
					},
				);
			});

			await Promise.all(emailPromises);

			this.logger.log(
				`Successfully sent ${emailPromises.length} email notifications for semester ongoing transition`,
			);
		} catch (error) {
			this.logger.error('Error handling semester ongoing transition', error);
			// Don't throw error to prevent semester update from failing
			// The main semester update should succeed even if notifications fail
		}
	}

	async updateEnrollments(semesterId: string, dto: UpdateEnrollmentsDto) {
		try {
			this.logger.log(
				`Starting enrollment update process for semester ${semesterId}`,
			);

			// Validate semester exists
			const semester = await this.findOne(semesterId);

			// Validate semester status - only allow updates when status is Ongoing
			if (semester.status !== SemesterStatus.Ongoing) {
				this.logger.warn(
					`Cannot update enrollments for semester ${semesterId}: status is ${semester.status}, must be ${SemesterStatus.Ongoing}`,
				);

				throw new ConflictException(
					`Cannot update enrollments: semester status must be ${SemesterStatus.Ongoing}`,
				);
			}

			// Validate all students belong to this semester
			const studentIds = dto.enrollments.map((e) => e.studentId);
			const existingEnrollments = await this.prisma.enrollment.findMany({
				where: {
					semesterId: semesterId,
					studentId: { in: studentIds },
				},
				include: {
					student: {
						include: {
							user: true,
						},
					},
				},
			});

			if (existingEnrollments.length !== studentIds.length) {
				const foundStudentIds = existingEnrollments.map((e) => e.studentId);
				const missingStudentIds = studentIds.filter(
					(id) => !foundStudentIds.includes(id),
				);

				this.logger.warn(
					`Some students not found in semester ${semesterId}:`,
					missingStudentIds,
				);

				throw new NotFoundException(
					`Some students are not enrolled in this semester: ${missingStudentIds.join(', ')}`,
				);
			}

			// Validate status transitions
			for (const update of dto.enrollments) {
				const existingEnrollment = existingEnrollments.find(
					(e) => e.studentId === update.studentId,
				);

				if (existingEnrollment) {
					this.validateEnrollmentStatusTransition(
						existingEnrollment.status,
						update.status,
						existingEnrollment.student.user.fullName,
					);
				}
			}

			// Tối ưu: updateMany cho từng trạng thái, sau đó findMany lấy lại enrollments đã update
			// Gom các update theo status
			const statusMap = new Map();
			for (const update of dto.enrollments) {
				if (!statusMap.has(update.status)) statusMap.set(update.status, []);
				statusMap.get(update.status).push(update.studentId);
			}
			// Update theo từng status
			for (const [status, studentIds] of statusMap.entries()) {
				await this.prisma.enrollment.updateMany({
					where: {
						semesterId: semesterId,
						studentId: { in: studentIds },
					},
					data: { status },
				});
			}
			// Lấy lại enrollments đã update (kèm student + user)
			const updatedEnrollments = await this.prisma.enrollment.findMany({
				where: {
					semesterId: semesterId,
					studentId: { in: dto.enrollments.map((e) => e.studentId) },
				},
				include: {
					student: {
						include: {
							user: true,
						},
					},
				},
			});

			this.logger.log(
				`Successfully updated ${updatedEnrollments.length} enrollments in semester ${semesterId}`,
			);

			// Send email notifications for enrollment result updates
			await this.sendEnrollmentResultNotifications(
				{
					id: semester.id,
					name: semester.name,
					code: semester.code,
				},
				updatedEnrollments,
			);

			return updatedEnrollments;
		} catch (error) {
			this.logger.error('Error updating enrollments', error);
			throw error;
		}
	}

	private validateEnrollmentStatusTransition(
		currentStatus: EnrollmentStatus,
		newStatus: EnrollmentStatus,
		studentName: string,
	) {
		// Define allowed transitions
		const allowedTransitions: Record<EnrollmentStatus, EnrollmentStatus[]> = {
			[EnrollmentStatus.NotYet]: [
				EnrollmentStatus.Ongoing,
				EnrollmentStatus.Failed,
				EnrollmentStatus.Passed,
			],
			[EnrollmentStatus.Ongoing]: [
				EnrollmentStatus.Failed,
				EnrollmentStatus.Passed,
			],
			[EnrollmentStatus.Failed]: [], // No transitions allowed from Failed
			[EnrollmentStatus.Passed]: [], // No transitions allowed from Passed
		};

		const allowedNewStatuses = allowedTransitions[currentStatus] || [];

		if (!allowedNewStatuses.includes(newStatus)) {
			this.logger.warn(
				`Invalid enrollment status transition for student ${studentName}: ${currentStatus} -> ${newStatus}`,
			);

			throw new ConflictException(
				`Invalid enrollment status transition for student ${studentName}: cannot change from ${currentStatus} to ${newStatus}`,
			);
		}

		this.logger.debug(
			`Enrollment status transition validation passed for ${studentName}: ${currentStatus} -> ${newStatus}`,
		);
	}

	private async sendEnrollmentResultNotifications(
		semester: { id: string; name: string; code: string },
		updatedEnrollments: any[],
	) {
		this.logger.log(
			`Sending enrollment result notifications for semester ${semester.id}`,
		);

		try {
			const studentIds = updatedEnrollments.map((e) => e.studentId);
			const groupParticipations =
				await this.prisma.studentGroupParticipation.findMany({
					where: {
						studentId: { in: studentIds },
						semesterId: semester.id,
					},
					select: {
						studentId: true,
						group: {
							select: {
								thesis: {
									select: {
										englishName: true,
										abbreviation: true,
									},
								},
							},
						},
					},
				});
			// Tạo map studentId -> thesis
			const thesisMap = new Map();
			for (const gp of groupParticipations) {
				thesisMap.set(gp.studentId, gp.group?.thesis || null);
			}

			const emailPromises = updatedEnrollments.map((enrollment) => {
				const enrollmentStatusText = this.getEnrollmentStatusText(
					enrollment.status as EnrollmentStatus,
				);
				const thesis = thesisMap.get(enrollment.studentId);
				const thesisEnglishName = thesis?.englishName || 'N/A';
				const thesisAbbreviation = thesis?.abbreviation || 'N/A';
				return this.emailQueueService.sendEmail(
					EmailJobType.SEND_ENROLLMENT_RESULT_NOTIFICATION,
					{
						to: enrollment.student.user.email,
						subject: `📋TheSync - Graduation Thesis Result Notification - ${semester.name}`,
						context: {
							fullName: enrollment.student.user.fullName,
							studentEmail: enrollment.student.user.email,
							semesterName: semester.name,
							semesterCode: semester.code,
							thesisEnglishName,
							thesisAbbreviation,
							enrollmentStatus: enrollment.status,
							enrollmentStatusText,
						},
					},
				);
			});

			await Promise.all(emailPromises);

			this.logger.log(
				`Successfully sent ${emailPromises.length} enrollment result notification emails`,
			);
		} catch (error) {
			this.logger.error('Error sending enrollment result notifications', error);
			throw error;
		}
	}

	private getEnrollmentStatusText(status: EnrollmentStatus): string {
		const statusMap = {
			[EnrollmentStatus.NotYet]: 'NotYet',
			[EnrollmentStatus.Ongoing]: 'Ongoing',
			[EnrollmentStatus.Passed]: 'Passed',
			[EnrollmentStatus.Failed]: 'Failed',
		};

		return statusMap[status] || status;
	}
}
