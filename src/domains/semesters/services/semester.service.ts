import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { CreateSemesterDto, UpdateSemesterDto } from '@/semesters/dto';
import { mapSemester } from '@/semesters/mappers';
import { SemesterResponse } from '@/semesters/responses';
import { SemesterStatusService } from '@/semesters/services/semester-status.service';

import {
	Enrollment,
	Group,
	Milestone,
	Semester,
	StudentGroupParticipation,
} from '~/generated/prisma';

type SemesterWithRelationships = Semester & {
	groups: Group[];
	enrollments: Enrollment[];
	milestones: Milestone[];
	studentGroupParticipations: StudentGroupParticipation[];
};

@Injectable()
export class SemesterService {
	private readonly logger = new Logger(SemesterService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly statusService: SemesterStatusService,
	) {}

	async create(dto: CreateSemesterDto): Promise<SemesterResponse> {
		this.logger.log('Starting semester creation process');

		try {
			await this.ensureNoDuplicate(dto.name, dto.code);

			await this.statusService.ensureNoActiveSemester();

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
			this.logger.debug('New semester details', JSON.stringify(newSemester));

			const result: SemesterResponse = mapSemester(newSemester);

			return result;
		} catch (error) {
			this.logger.error('Error creating semester', error);

			throw error;
		}
	}

	async findAll(): Promise<SemesterResponse[]> {
		this.logger.log('Retrieving all semesters');

		try {
			const semesters = await this.prisma.semester.findMany({
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${semesters.length} semesters`);
			this.logger.debug('Semesters details', JSON.stringify(semesters));

			const result: SemesterResponse[] = semesters.map(mapSemester);

			return result;
		} catch (error) {
			this.logger.error('Error retrieving semesters', error);

			throw error;
		}
	}

	async findOne(id: string): Promise<SemesterResponse> {
		this.logger.log(`Fetching semester with ID: ${id}`);

		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!semester) {
				this.logger.warn(`Semester with ID ${id} not found`);

				throw new NotFoundException(`Semester not found`);
			}

			this.logger.log(`Semester with ID ${id} retrieved successfully`);
			this.logger.debug('Semester details', JSON.stringify(semester));

			const result: SemesterResponse = mapSemester(semester);

			return result;
		} catch (error) {
			this.logger.error('Error fetching semester:', error);

			throw error;
		}
	}

	async update(id: string, dto: UpdateSemesterDto): Promise<SemesterResponse> {
		this.logger.log(`Updating semester with ID: ${id}`);

		try {
			const existingSemester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!existingSemester) {
				this.logger.warn(`Semester with ID ${id} not found`);

				throw new NotFoundException(`Semester with ID ${id} not found`);
			}

			await this.statusService.validateSemesterUpdate(existingSemester, dto);

			const updatedDto = this.statusService.prepareUpdateData(
				existingSemester,
				dto,
			);

			const updated = await this.prisma.semester.update({
				where: { id },
				data: updatedDto,
			});

			this.logger.log(`Semester with ID ${id} updated successfully`);
			this.logger.debug('Updated semester details', JSON.stringify(updated));

			const result: SemesterResponse = mapSemester(updated);

			return result;
		} catch (error) {
			this.logger.error(`Error updating semester with ID ${id}`, error);

			throw error;
		}
	}

	async remove(id: string): Promise<SemesterResponse> {
		this.logger.log(`Removing semester with ID: ${id}`);

		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id },
				include: {
					groups: true,
					enrollments: true,
					milestones: true,
					studentGroupParticipations: true,
				},
			});

			if (!semester) {
				this.logger.warn(`Semester ${id} not found`);

				throw new NotFoundException(`Semester not found`);
			}

			this.statusService.ensureDeletableStatus(semester);
			this.ensureNoDependencies(semester);

			const deleted = await this.prisma.semester.delete({ where: { id } });

			this.logger.log(`Deleted semester with ID: ${id}`);
			this.logger.debug('Deleted semester details', JSON.stringify(deleted));

			const result: SemesterResponse = mapSemester(deleted);

			return result;
		} catch (error) {
			this.logger.error('Failed to delete semester', error);

			throw error;
		}
	}

	// ------------------------------------------------------------------------------------------
	// Additional methods for semester management can be added here
	// ------------------------------------------------------------------------------------------

	private async ensureNoDuplicate(name: string, code: string): Promise<void> {
		const conflictSemester = await this.prisma.semester.findFirst({
			where: {
				OR: [{ name: name }, { code: code }],
			},
		});

		if (conflictSemester) {
			const field = conflictSemester.name === name ? 'name' : 'code';
			this.logger.warn(`Duplicate ${field}: ${name}`);

			throw new ConflictException(`Semester with this ${field} already exists`);
		}

		return;
	}

	private ensureNoDependencies(semester: SemesterWithRelationships): void {
		const hasRelations =
			semester.groups.length > 0 ||
			semester.enrollments.length > 0 ||
			semester.milestones.length > 0 ||
			semester.studentGroupParticipations.length > 0;

		if (hasRelations) {
			this.logger.warn(`Semester ${semester.id} has dependent relationships`);

			throw new ConflictException(
				`Cannot delete semester: it has related data.`,
			);
		}
	}
}
