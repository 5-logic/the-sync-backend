import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { mapLecturerV1, mapLecturerV2 } from '@/lecturers/mappers';
import { LecturerResponse } from '@/lecturers/responses';
import { PrismaService } from '@/providers';
import { UpdateUserDto } from '@/users/dto';

@Injectable()
export class LecturerService {
	private readonly logger = new Logger(LecturerService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll(): Promise<LecturerResponse[]> {
		this.logger.log('Fetching all lecturers');

		try {
			const lecturers = await this.prisma.lecturer.findMany({
				include: {
					user: true,
				},
				orderBy: {
					user: {
						createdAt: 'desc',
					},
				},
			});

			this.logger.log(`Found ${lecturers.length} lecturers`);
			this.logger.debug('Lecturers data', JSON.stringify(lecturers));

			const result: LecturerResponse[] = lecturers.map(mapLecturerV2);

			return result;
		} catch (error) {
			this.logger.error('Error fetching lecturers', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<LecturerResponse> {
		this.logger.log(`Fetching lecturer with ID: ${id}`);

		try {
			const lecturer = await this.prisma.lecturer.findUnique({
				where: { userId: id },
				include: {
					user: true,
				},
			});

			if (!lecturer) {
				this.logger.warn(`Lecturer with ID ${id} not found`);

				throw new NotFoundException(`Lecturer not found`);
			}

			this.logger.log(`Lecturer found with ID: ${lecturer.userId}`);
			this.logger.debug('Lecturer detail', JSON.stringify(lecturer));

			const result: LecturerResponse = mapLecturerV2(lecturer);

			return result;
		} catch (error) {
			this.logger.error(`Error fetching lecturer with ID ${id}`, error);
			throw error;
		}
	}

	async update(id: string, dto: UpdateUserDto): Promise<LecturerResponse> {
		this.logger.log(`Updating lecturer with ID: ${id}`);

		try {
			const result = await this.prisma.$transaction(async (txn) => {
				const existingLecturer = await txn.lecturer.findUnique({
					where: { userId: id },
				});

				if (!existingLecturer) {
					this.logger.warn(`Lecturer with ID ${id} not found for update`);

					throw new NotFoundException(`Lecturer not found`);
				}

				const updatedUser = await txn.user.update({
					where: { id: id },
					data: {
						fullName: dto.fullName,
						gender: dto.gender,
						phoneNumber: dto.phoneNumber,
					},
				});

				const result: LecturerResponse = mapLecturerV1(
					updatedUser,
					existingLecturer,
				);

				return result;
			});

			this.logger.log(`Lecturer updated with ID: ${result.id}`);
			this.logger.debug('Updated Lecturer', JSON.stringify(result));

			return result;
		} catch (error) {
			this.logger.error(`Error updating lecturer with ID ${id}`, error);

			throw error;
		}
	}
}
