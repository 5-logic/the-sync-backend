import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CONSTANTS } from '@/configs';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import { CreateSemesterDto, UpdateSemesterDto } from '@/semesters/dto';

import {
	EnrollmentStatus,
	OngoingPhase,
	SemesterStatus,
} from '~/generated/prisma';

@Injectable()
export class SemesterService {
	private readonly logger = new Logger(SemesterService.name);
	private static readonly CACHE_KEY = 'cache:/semesters';

	constructor(
		private readonly prisma: PrismaService,
		private readonly emailQueueService: EmailQueueService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {}

	private async getCachedData<T>(key: string): Promise<T | null> {
		try {
			const result = await this.cacheManager.get<T>(key);
			return result ?? null;
		} catch (error) {
			this.logger.warn(`Cache get error for key ${key}:`, error);
			return null;
		}
	}

	private async setCachedData(
		key: string,
		data: any,
		ttl?: number,
	): Promise<void> {
		try {
			await this.cacheManager.set(key, data, ttl ?? CONSTANTS.TTL);
		} catch (error) {
			this.logger.warn(`Cache set error for key ${key}:`, error);
		}
	}

	private async clearCache(pattern?: string): Promise<void> {
		try {
			if (pattern) {
				await this.cacheManager.del(pattern);
			} else {
				this.logger.warn('Cache reset not implemented for current store');
			}
		} catch (error) {
			this.logger.warn(`Cache clear error:`, error);
		}
	}

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
				},
			});

			this.logger.log(
				`Semester created successfully with ID: ${newSemester.id}`,
			);
			this.logger.debug('New semester details', newSemester);

			// Clear cache after creating new semester
			await this.clearCache(`${SemesterService.CACHE_KEY}:all`);

			return newSemester;
		} catch (error) {
			this.logger.error('Error creating semester', error);

			throw error;
		}
	}

	async findAll() {
		try {
			const cacheKey = `${SemesterService.CACHE_KEY}:all`;
			const cachedSemesters = await this.getCachedData<any[]>(cacheKey);
			if (cachedSemesters) {
				this.logger.log(
					`Found ${cachedSemesters.length} semesters (from cache)`,
				);
				return cachedSemesters;
			}

			const semesters = await this.prisma.semester.findMany({
				orderBy: { createdAt: 'desc' },
			});

			await this.setCachedData(cacheKey, semesters);

			this.logger.log(`Found ${semesters.length} semesters`);

			return semesters;
		} catch (error) {
			this.logger.error('Error fetching semesters:', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			const cacheKey = `${SemesterService.CACHE_KEY}:${id}`;
			const cachedSemester = await this.getCachedData<any>(cacheKey);
			if (cachedSemester) {
				this.logger.log(
					`Semester found with ID: ${cachedSemester.id} (from cache)`,
				);
				return cachedSemester;
			}

			const semester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!semester) {
				throw new NotFoundException(`Semester not found`);
			}

			await this.setCachedData(cacheKey, semester);

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
			this.performUpdateValidations(existingSemester, dto);

			const updateData = this.prepareUpdateData(existingSemester, dto);

			const updatedSemester = await this.prisma.semester.update({
				where: { id },
				data: updateData,
			});

			// Handle enrollment status update and email notifications when status changes to Ongoing
			if (
				existingSemester.status !== SemesterStatus.Ongoing &&
				dto.status === SemesterStatus.Ongoing
			) {
				await this.handleSemesterOngoingTransition(updatedSemester);
			}

			this.logger.log(
				`Semester updated successfully with ID: ${updatedSemester.id}`,
			);
			this.logger.debug('Updated semester details', updatedSemester);

			// Clear cache after updating semester
			await this.clearCache(`${SemesterService.CACHE_KEY}:all`);
			await this.clearCache(`${SemesterService.CACHE_KEY}:${id}`);

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

			// Clear cache after deleting semester
			await this.clearCache(`${SemesterService.CACHE_KEY}:all`);
			await this.clearCache(`${SemesterService.CACHE_KEY}:${id}`);

			return deletedSemester;
		} catch (error) {
			this.logger.error('Error removing semester', error);

			throw error;
		}
	}

	private validateStatusTransition(
		currentStatus: SemesterStatus,
		newStatus: SemesterStatus,
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

	private validateOngoingToEndTransition(ongoingPhase: OngoingPhase | null) {
		if (ongoingPhase !== OngoingPhase.ScopeLocked) {
			this.logger.warn(
				`Cannot transition from ${SemesterStatus.Ongoing} to ${SemesterStatus.End}: ongoingPhase must be ${OngoingPhase.ScopeLocked}, current: ${ongoingPhase}`,
			);

			throw new ConflictException(
				`Cannot transition from ${SemesterStatus.Ongoing} to ${SemesterStatus.End}: ongoingPhase must be ${OngoingPhase.ScopeLocked}`,
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

	private performUpdateValidations(
		existingSemester: {
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
			this.validateStatusTransition(
				existingSemester.status,
				updateSemesterDto.status,
			);
		}

		if (updateSemesterDto.maxGroup !== undefined) {
			this.validateMaxGroupUpdate(
				existingSemester.status,
				updateSemesterDto.status,
			);
		}

		this.validatePickingToOngoingFlow(existingSemester, updateSemesterDto);
		this.validateOngoingPhaseFlow(existingSemester, updateSemesterDto);

		if (
			existingSemester.status === SemesterStatus.Ongoing &&
			updateSemesterDto.status === SemesterStatus.End
		) {
			this.validateOngoingToEndTransition(existingSemester.ongoingPhase);
		}
	}

	private validatePickingToOngoingFlow(
		existingSemester: {
			status: SemesterStatus;
			maxGroup: number | null;
		},
		updateSemesterDto: UpdateSemesterDto,
	) {
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
						subject: `Thông báo học kỳ ${semester.name} đã bắt đầu - TheSync`,
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
}
