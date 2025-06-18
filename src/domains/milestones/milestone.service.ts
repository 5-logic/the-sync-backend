import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CreateMilestoneDto } from '@/milestones/dto/create-milestone.dto';
import { UpdateMilestoneDto } from '@/milestones/dto/update-milestone.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class MilestoneService {
	private readonly logger = new Logger(MilestoneService.name);

	constructor(private readonly prisma: PrismaService) {}

	private async validateSemester(semesterId: string) {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});
		if (!semester) {
			throw new NotFoundException(`Semester with id ${semesterId} not found`);
		}
	}

	private async validateMilestone(id: string) {
		const milestone = await this.prisma.milestone.findUnique({
			where: { id },
			include: {
				semester: { select: { id: true, name: true } },
			},
		});
		if (!milestone) {
			throw new NotFoundException(`Milestone with id ${id} not found`);
		}
		return milestone;
	}

	async create(createMilestoneDto: CreateMilestoneDto) {
		try {
			await this.validateSemester(createMilestoneDto.semesterId);

			const overlappingMilestone = await this.prisma.milestone.findFirst({
				where: {
					semesterId: createMilestoneDto.semesterId,
					startDate: { lt: new Date(createMilestoneDto.endDate) },
					endDate: { gt: new Date(createMilestoneDto.startDate) },
				},
			});

			if (overlappingMilestone) {
				throw new ConflictException(
					`Milestone time overlaps with existing milestone: ${overlappingMilestone.name}`,
				);
			}

			const milestone = await this.prisma.milestone.create({
				data: {
					name: createMilestoneDto.name,
					startDate: new Date(createMilestoneDto.startDate),
					endDate: new Date(createMilestoneDto.endDate),
					semesterId: createMilestoneDto.semesterId,
					checklistId: createMilestoneDto.checklistId,
				},
			});

			this.logger.log(`Milestone created with ID: ${milestone.id}`);
			this.logger.debug('Milestone detail', milestone);

			return milestone;
		} catch (error) {
			this.logger.error('Failed to create milestone', error);
			throw error;
		}
	}

	async findAll() {
		try {
			this.logger.log('Fetching all milestones');

			const milestones = await this.prisma.milestone.findMany({
				include: {
					semester: { select: { id: true, name: true } },
				},
			});

			this.logger.log(`Found ${milestones.length} milestones`);
			this.logger.debug('Milestones detail', milestones);

			return milestones;
		} catch (error) {
			this.logger.error('Error fetching milestones', error);

			throw error;
		}
	}

	async findOne(id: string) {
		try {
			this.logger.log(`Fetching milestone with ID: ${id}`);

			const milestone = await this.validateMilestone(id);

			if (!milestone) {
				throw new NotFoundException(`Milestone with ID ${id} not found`);
			}

			this.logger.log(`Milestone found with ID: ${id}`);
			this.logger.debug('Milestone detail', milestone);

			return milestone;
		} catch (error) {
			this.logger.error(`Error fetching milestone with ID ${id}`, error);
			throw error;
		}
	}

	async update(id: string, dto: UpdateMilestoneDto) {
		try {
			const existing = await this.validateMilestone(id);

			const startDate = dto.startDate
				? new Date(dto.startDate)
				: existing.startDate;
			const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
			const semesterId = dto.semesterId ?? existing.semesterId;

			const overlap = await this.prisma.milestone.findFirst({
				where: {
					id: { not: id },
					semesterId,
					startDate: { lt: endDate },
					endDate: { gt: startDate },
				},
			});

			if (overlap) {
				throw new ConflictException(
					`Updated milestone overlaps with: ${overlap.name}`,
				);
			}

			const updated = await this.prisma.milestone.update({
				where: { id },
				data: {
					name: dto.name,
					startDate: dto.startDate ? startDate : undefined,
					endDate: dto.endDate ? endDate : undefined,
					semesterId: dto.semesterId,
					checklistId: dto.checklistId,
				},
			});

			this.logger.log(`Milestone updated with ID: ${updated.id}`);
			this.logger.debug('Updated Milestone', updated);

			return updated;
		} catch (error) {
			this.logger.error(`Failed to update milestone ${id}`, error);

			throw error;
		}
	}
}
