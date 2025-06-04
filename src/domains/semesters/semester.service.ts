import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';
import { CreateSemesterDto } from '@/semesters/dto/create-semester.dto';
import { UpdateSemesterDto } from '@/semesters/dto/update-semester.dto';

import { Semester } from '~/generated/prisma';

@Injectable()
export class SemesterService {
	private readonly logger = new Logger(SemesterService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createSemesterDto: CreateSemesterDto): Promise<Semester> {
		try {
			const newSemester = await this.prisma.semester.create({
				data: createSemesterDto,
			});

			this.logger.log(`Semester created with ID: ${newSemester.id}`);
			this.logger.debug(`Semester`, newSemester);

			return newSemester;
		} catch (error) {
			this.logger.error('Error creating semester', error);
			throw error;
		}
	}

	async findAll(): Promise<Semester[]> {
		try {
			const semesters = await this.prisma.semester.findMany();

			this.logger.log(`Found ${semesters.length} semesters`);

			return semesters;
		} catch (error) {
			this.logger.error('Error fetching semesters', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<Semester | null> {
		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!semester) {
				this.logger.warn(`Semester with ID ${id} not found`);
				return null;
			}

			this.logger.log(`Semester found with ID: ${semester.id}`);
			return semester;
		} catch (error) {
			this.logger.error('Error fetching semester', error);
			throw error;
		}
	}

	async update(
		id: string,
		updateSemesterDto: UpdateSemesterDto,
	): Promise<Semester> {
		try {
			const updatedSemester = await this.prisma.semester.update({
				where: { id },
				data: updateSemesterDto,
			});

			this.logger.log(`Semester updated with ID: ${updatedSemester.id}`);
			return updatedSemester;
		} catch (error) {
			this.logger.error('Error updating semester', error);
			throw error;
		}
	}

	async remove(id: string): Promise<Semester> {
		try {
			const deletedSemester = await this.prisma.semester.delete({
				where: { id },
			});

			this.logger.log(`Semester deleted with ID: ${deletedSemester.id}`);
			return deletedSemester;
		} catch (error) {
			this.logger.error('Error deleting semester', error);
			throw error;
		}
	}
}
