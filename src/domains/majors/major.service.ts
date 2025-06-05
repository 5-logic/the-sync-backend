import { Injectable, Logger } from '@nestjs/common';

import { CreateMajorDto } from '@/majors/dto/create-major.dto';
import { UpdateMajorDto } from '@/majors/dto/update-major.dto';
import { PrismaService } from '@/providers/prisma.service';

@Injectable()
export class MajorService {
	private readonly logger = new Logger(MajorService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createMajorDto: CreateMajorDto): Promise<any> {
		try {
			const newMajor = await this.prisma.major.create({
				data: { ...createMajorDto },
				include: {
					students: {
						select: { userId: true },
					},
				},
			});

			this.logger.log(`Major created with ID: ${newMajor.id}`);
			this.logger.debug(`Major`, newMajor);

			return {
				...newMajor,
				students: newMajor.students.map((s) => s.userId),
			};
		} catch (error) {
			this.logger.error('Error creating major', error);
			throw error;
		}
	}

	async findAll(): Promise<any[]> {
		try {
			const majors = await this.prisma.major.findMany({
				include: {
					students: {
						select: { userId: true },
					},
				},
			});

			this.logger.log(`Found ${majors.length} majors`);

			return majors.map((major) => ({
				...major,
				students: major.students.map((s) => s.userId),
			}));
		} catch (error) {
			this.logger.error('Error fetching majors', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<any> {
		try {
			const major = await this.prisma.major.findUnique({
				where: { id },
				include: {
					students: {
						select: { userId: true },
					},
				},
			});

			if (!major) {
				this.logger.warn(`Major with ID ${id} not found`);
				return null;
			} else {
				this.logger.log(`Major found with ID: ${major.id}`);
			}

			return {
				...major,
				students: major.students.map((s) => s.userId),
			};
		} catch (error) {
			this.logger.error(`Error fetching major with ID ${id}`, error);
			throw error;
		}
	}

	async update(id: string, updateMajorDto: UpdateMajorDto): Promise<any> {
		try {
			const updatedMajor = await this.prisma.major.update({
				where: { id },
				data: { ...updateMajorDto },
				include: {
					students: {
						select: { userId: true },
					},
				},
			});

			this.logger.log(`Major updated with ID: ${updatedMajor.id}`);
			this.logger.debug(`Updated Major`, updatedMajor);

			return {
				...updatedMajor,
				students: updatedMajor.students.map((s) => s.userId),
			};
		} catch (error) {
			this.logger.error(`Error updating major with ID ${id}`, error);
			throw error;
		}
	}

	async remove(id: string): Promise<any> {
		try {
			const deletedMajor = await this.prisma.major.delete({
				where: { id },
			});

			this.logger.log(`Major deleted with ID: ${deletedMajor.id}`);
			this.logger.debug(`Deleted Major`, deletedMajor);

			return {
				status: 'success',
				message: `Major with ID ${deletedMajor.id} deleted successfully`,
			};
		} catch (error) {
			this.logger.error(`Error deleting major with ID ${id}`, error);
			throw error;
		}
	}
}
