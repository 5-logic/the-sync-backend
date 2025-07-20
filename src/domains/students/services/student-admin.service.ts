import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers';
import {
	CreateStudentDto,
	ImportStudentDto,
	ToggleStudentStatusDto,
	UpdateStudentDto,
} from '@/students/dtos';
import { mapStudentV1 } from '@/students/mappers';
import { StudentResponse } from '@/students/responses';

@Injectable()
export class StudentAdminService {
	private readonly logger = new Logger(StudentAdminService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(dto: CreateStudentDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async createMany(dto: ImportStudentDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async updateByAdmin(id: string, dto: UpdateStudentDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async toggleStatus(id: string, dto: ToggleStudentStatusDto) {
		this.logger.log(
			`Toggling status for student with ID: ${id}, isActive: ${dto.isActive}`,
		);

		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const existingStudent = await prisma.student.findUnique({
					where: { userId: id },
				});

				if (!existingStudent) {
					this.logger.warn(`Student with ID ${id} not found for status toggle`);

					throw new NotFoundException(`Student not found`);
				}

				const updatedUser = await prisma.user.update({
					where: { id },
					data: {
						isActive: dto.isActive,
					},
				});

				const result: StudentResponse = mapStudentV1(
					updatedUser,
					existingStudent,
				);

				return result;
			});

			this.logger.log(
				`Student status updated - ID: ${id}, isActive: ${dto.isActive}`,
			);
			this.logger.debug('Updated student status', JSON.stringify(result));

			return result;
		} catch (error) {
			this.logger.error(`Error toggling student status with ID ${id}`, error);

			throw error;
		}
	}

	async delete(id: string, semesterId: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
}
