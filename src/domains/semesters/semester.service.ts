import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateSemesterDto } from '@/semesters/dto/create-semester.dto';
import { UpdateSemesterDto } from '@/semesters/dto/update-semester.dto';

import { OngoingPhase, SemesterStatus } from '~/generated/prisma';

@Injectable()
export class SemesterService {
	private readonly logger = new Logger(SemesterService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createSemesterDto: CreateSemesterDto) {
		try {
			this.logger.log('Starting semester creation process');

			const conflictSemester = await this.prisma.semester.findFirst({
				where: {
					OR: [
						{ name: createSemesterDto.name },
						{ code: createSemesterDto.code },
					],
				},
			});

			if (conflictSemester) {
				const field =
					conflictSemester.name === createSemesterDto.name ? 'name' : 'code';
				this.logger.warn(`Duplicate ${field}: ${createSemesterDto[field]}`);

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
				data: createSemesterDto,
			});

			this.logger.log(
				`Semester created successfully with ID: ${newSemester.id}`,
			);
			this.logger.debug('New semester details', newSemester);

			return newSemester;
		} catch (error) {
			this.logger.error('Error creating semester', error);

			throw error;
		}
	}

	async findAll() {
		try {
			const semesters = await this.prisma.semester.findMany();

			this.logger.log(`Found ${semesters.length} semesters`);
			this.logger.debug('Semesters detail', semesters);

			return semesters;
		} catch (error) {
			this.logger.error('Error fetching semesters', error);

			throw error;
		}
	}

	async findOne(id: string) {
		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!semester) {
				this.logger.warn(`Semester with ID ${id} not found`);

				throw new NotFoundException(`Semester with ID ${id} not found`);
			}

			this.logger.log(`Semester found with ID: ${semester.id}`);
			this.logger.debug('Semester detail', semester);

			return semester;
		} catch (error) {
			this.logger.error('Error fetching semester', error);

			throw error;
		}
	}

	async update(id: string, updateSemesterDto: UpdateSemesterDto) {
		try {
			this.logger.log(`Starting semester update process for ID: ${id}`);

			const existingSemester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!existingSemester) {
				this.logger.warn(`Semester with ID ${id} not found for update`);

				throw new NotFoundException(`Semester with ID ${id} not found`);
			}

			this.logger.debug('Existing semester found', existingSemester);

			if (existingSemester.status === SemesterStatus.End) {
				this.logger.warn(
					`Cannot update semester with ID ${id}: semester has already ended`,
				);

				throw new ConflictException(
					'Cannot update semester. This semester has already ended',
				);
			}

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

			if (
				existingSemester.status === SemesterStatus.Ongoing &&
				updateSemesterDto.status === SemesterStatus.End
			) {
				this.validateOngoingToEndTransition(existingSemester.ongoingPhase);
			}

			const updateData = { ...updateSemesterDto };

			if (
				existingSemester.status === SemesterStatus.Picking &&
				updateSemesterDto.status === SemesterStatus.Ongoing
			) {
				updateData.ongoingPhase = OngoingPhase.ScopeAdjustable;

				this.logger.debug('Auto-setting ongoingPhase to ScopeAdjustable');
			}

			const updatedSemester = await this.prisma.semester.update({
				where: { id },
				data: updateData,
			});

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
				`Invalid status transition. Can only move from ${currentStatus} to ${statusOrder[currentIndex + 1] || 'nowhere'}`,
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
			SemesterStatus.Picking,
			SemesterStatus.Ongoing,
		];

		const statusToCheck = newStatus || currentStatus;

		if (!allowedStatuses.includes(statusToCheck)) {
			this.logger.warn(
				`Cannot update maxGroup when status is ${statusToCheck}`,
			);

			throw new ConflictException(
				`maxGroup can only be updated when status is ${SemesterStatus.Picking} or ${SemesterStatus.Ongoing}`,
			);
		}

		this.logger.debug('maxGroup update validation passed');
	}

	private validatePickingToOngoingTransition(
		currentMaxGroup: number | null,
		updateDto: UpdateSemesterDto,
	) {
		const newMaxGroup = updateDto.maxGroup;

		const effectiveMaxGroup =
			newMaxGroup !== undefined ? newMaxGroup : currentMaxGroup;

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
		const statusToCheck = newStatus || currentStatus;

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
}
