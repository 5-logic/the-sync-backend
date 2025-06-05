import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';
import { CreateSemesterDto } from '@/semesters/dto/create-semester.dto';
import { UpdateSemesterDto } from '@/semesters/dto/update-semester.dto';

@Injectable()
export class SemesterService {
	private readonly logger = new Logger(SemesterService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createSemesterDto: CreateSemesterDto): Promise<any> {
		try {
			const newSemester = await this.prisma.semester.create({
				data: createSemesterDto,
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
			});

			this.logger.log(`Semester created with ID: ${newSemester.id}`);
			this.logger.debug(`Semester`, newSemester);

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

	async findAll(): Promise<any[]> {
		try {
			const semesters = await this.prisma.semester.findMany({
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
				orderBy: { startDate: 'asc' },
			});

			this.logger.log(`Found ${semesters.length} semesters`);

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

	async findOne(id: string): Promise<any> {
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
				return null;
			}

			this.logger.log(`Semester found with ID: ${semester.id}`);
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

	async update(id: string, updateSemesterDto: UpdateSemesterDto): Promise<any> {
		try {
			const updatedSemester = await this.prisma.semester.update({
				where: { id },
				data: updateSemesterDto,
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
			});

			this.logger.log(`Semester updated with ID: ${updatedSemester.id}`);
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

	async remove(id: string): Promise<any> {
		try {
			const deletedSemester = await this.prisma.semester.delete({
				where: { id },
			});

			this.logger.log(`Semester deleted with ID: ${deletedSemester.id}`);
			return {
				status: 'success',
				message: `Semester with ID ${deletedSemester.id} deleted successfully`,
			};
		} catch (error) {
			this.logger.error('Error deleting semester', error);
			throw error;
		}
	}
}
