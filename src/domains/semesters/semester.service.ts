import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateSemesterDto } from '@/semesters/dto/create-semester.dto';
import { UpdateSemesterDto } from '@/semesters/dto/update-semester.dto';

import { SemesterStatus } from '~/generated/prisma';

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

			return updatedSemester;
		} catch (error) {
			this.logger.error('Error updating semester', error);

			throw error;
		}
	}
}
