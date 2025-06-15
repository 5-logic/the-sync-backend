import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateSemesterDto } from '@/semesters/dto/create-semester.dto';
import { UpdateSemesterDto } from '@/semesters/dto/update-semester.dto';

@Injectable()
export class SemesterService {
	private readonly logger = new Logger(SemesterService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createSemesterDto: CreateSemesterDto) {
		try {
			const newSemester = await this.prisma.semester.create({
				data: createSemesterDto,
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
			});

			if (
				typeof createSemesterDto.status === 'string' &&
				['Preparing', 'Picking', 'Ongoing'].includes(createSemesterDto.status)
			) {
				const conflictingSemester = await this.prisma.semester.findFirst({
					where: {
						status: createSemesterDto.status,
					},
				});

				if (conflictingSemester) {
					this.logger.warn(
						`Another semester already has status ${createSemesterDto.status}`,
					);

					throw new ConflictException(
						`Another semester already has status ${createSemesterDto.status}. Only one semester can have this status at a time.`,
					);
				}
			}

			this.logger.log(`Semester created with ID: ${newSemester.id}`);
			this.logger.debug('Semester detail', newSemester);

			return {
				...newSemester,
				milestones: newSemester.milestones.map((m) => m.id),
				groups: newSemester.groups.map((g) => g.id),
			};
		} catch (error) {
			this.logger.error('Error creating semester', error);

			throw error;
		}
	}

	async findAll() {
		try {
			const semesters = await this.prisma.semester.findMany({
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
			});

			this.logger.log(`Found ${semesters.length} semesters`);
			this.logger.debug('Semesters detail', semesters);

			return semesters.map((s) => ({
				...s,
				milestones: s.milestones.map((m) => m.id),
				groups: s.groups.map((g) => g.id),
			}));
		} catch (error) {
			this.logger.error('Error fetching semesters', error);

			throw error;
		}
	}

	async findOne(id: string) {
		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id },
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
			});

			if (!semester) {
				this.logger.warn(`Semester with ID ${id} not found`);

				throw new NotFoundException(`Semester with ID ${id} not found`);
			}

			this.logger.log(`Semester found with ID: ${semester.id}`);
			this.logger.debug('Semester detail', semester);

			return {
				...semester,
				milestones: semester.milestones.map((m) => m.id),
				groups: semester.groups.map((g) => g.id),
			};
		} catch (error) {
			this.logger.error('Error fetching semester', error);

			throw error;
		}
	}

	async update(id: string, updateSemesterDto: UpdateSemesterDto) {
		try {
			const existingSemester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!existingSemester) {
				this.logger.warn(`Semester with ID ${id} not found for update`);

				throw new NotFoundException(`Semester with ID ${id} not found`);
			}

			if (
				typeof updateSemesterDto.status === 'string' &&
				['Preparing', 'Picking', 'Ongoing'].includes(updateSemesterDto.status)
			) {
				const conflictingSemester = await this.prisma.semester.findFirst({
					where: {
						status: updateSemesterDto.status,
						id: { not: id },
					},
				});

				if (conflictingSemester) {
					this.logger.warn(
						`Another semester already has status ${updateSemesterDto.status}`,
					);

					throw new ConflictException(
						`Another semester already has status ${updateSemesterDto.status}. Only one semester can have this status at a time.`,
					);
				}
			}

			const updatedSemester = await this.prisma.semester.update({
				where: { id },
				data: updateSemesterDto,
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
			});

			this.logger.log(`Semester updated with ID: ${updatedSemester.id}`);
			this.logger.debug('Updated Semester', updatedSemester);

			return {
				...updatedSemester,
				milestones: updatedSemester.milestones.map((m) => m.id),
				groups: updatedSemester.groups.map((g) => g.id),
			};
		} catch (error) {
			this.logger.error('Error updating semester', error);

			throw error;
		}
	}
}
