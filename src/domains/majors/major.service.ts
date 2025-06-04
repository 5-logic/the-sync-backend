import { Injectable, Logger } from '@nestjs/common';

import { CreateMajorDto } from '@/majors/dto/create-major.dto';
import { UpdateMajorDto } from '@/majors/dto/update-major.dto';
import { PrismaService } from '@/providers/prisma.service';

import { Major } from '~/generated/prisma';

@Injectable()
export class MajorService {
	private readonly logger = new Logger(MajorService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createMajorDto: CreateMajorDto): Promise<Major> {
		try {
			const newMajor = await this.prisma.major.create({
				data: { ...createMajorDto },
			});

			this.logger.log(`Major created with ID: ${newMajor.id}`);
			this.logger.debug(`Major`, newMajor);

			return newMajor;
		} catch (error) {
			this.logger.error('Error creating major', error);
			throw error;
		}
	}

	async findAll(): Promise<Major[]> {
		try {
			const majors = await this.prisma.major.findMany();

			this.logger.log(`Found ${majors.length} majors`);

			return majors;
		} catch (error) {
			this.logger.error('Error fetching majors', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<Major | null> {
		try {
			const major = await this.prisma.major.findUnique({
				where: { id },
			});

			if (!major) {
				this.logger.warn(`Major with ID ${id} not found`);
			} else {
				this.logger.log(`Major found with ID: ${major.id}`);
			}

			return major;
		} catch (error) {
			this.logger.error(`Error fetching major with ID ${id}`, error);
			throw error;
		}
	}

	async update(id: string, updateMajorDto: UpdateMajorDto): Promise<Major> {
		try {
			const updatedMajor = await this.prisma.major.update({
				where: { id },
				data: { ...updateMajorDto },
			});

			this.logger.log(`Major updated with ID: ${updatedMajor.id}`);
			this.logger.debug(`Updated Major`, updatedMajor);

			return updatedMajor;
		} catch (error) {
			this.logger.error(`Error updating major with ID ${id}`, error);
			throw error;
		}
	}

	async remove(id: string): Promise<Major> {
		try {
			const deletedMajor = await this.prisma.major.delete({
				where: { id },
			});

			this.logger.log(`Major deleted with ID: ${deletedMajor.id}`);
			this.logger.debug(`Deleted Major`, deletedMajor);

			return deletedMajor;
		} catch (error) {
			this.logger.error(`Error deleting major with ID ${id}`, error);
			throw error;
		}
	}
}
