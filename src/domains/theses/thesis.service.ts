import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';
import { CreateThesisDto } from '@/theses/dto/create-thesis.dto';
import { UpdateThesisDto } from '@/theses/dto/update-thesis.dto';

import { Thesis } from '~/generated/prisma';

@Injectable()
export class ThesisService {
	private readonly logger = new Logger(ThesisService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createThesisDto: CreateThesisDto): Promise<Thesis> {
		try {
			const newThesis: Thesis = await this.prisma.thesis.create({
				data: { ...createThesisDto },
			});

			this.logger.log(`Thesis created with ID: ${newThesis.id}`);
			this.logger.debug(`Thesis`, newThesis);

			return newThesis;
		} catch (error) {
			this.logger.error('Error creating thesis', error);

			throw error;
		}
	}

	async findAll(): Promise<Thesis[]> {
		try {
			const theses: Thesis[] = await this.prisma.thesis.findMany();

			this.logger.log(`Found ${theses.length} theses`);

			return theses;
		} catch (error) {
			this.logger.error('Error fetching theses', error);

			throw error;
		}
	}

	async findOne(id: string): Promise<Thesis | null> {
		try {
			const thesis: Thesis | null = await this.prisma.thesis.findUnique({
				where: { id },
			});

			if (!thesis) {
				this.logger.warn(`Thesis with ID ${id} not found`);
			} else {
				this.logger.log(`Thesis found with ID: ${thesis.id}`);
			}

			return thesis;
		} catch (error) {
			this.logger.error(`Error fetching thesis with ID ${id}`, error);

			throw error;
		}
	}

	async update(id: string, updateThesisDto: UpdateThesisDto): Promise<Thesis> {
		try {
			const updatedThesis: Thesis = await this.prisma.thesis.update({
				where: { id },
				data: { ...updateThesisDto },
			});

			this.logger.log(`Thesis updated with ID: ${updatedThesis.id}`);
			this.logger.debug(`Updated Thesis`, updatedThesis);

			return updatedThesis;
		} catch (error) {
			this.logger.error(`Error updating thesis with ID ${id}`, error);

			throw error;
		}
	}

	async remove(id: string): Promise<Thesis> {
		try {
			const deletedThesis: Thesis = await this.prisma.thesis.delete({
				where: { id },
			});

			this.logger.log(`Thesis deleted with ID: ${deletedThesis.id}`);

			return deletedThesis;
		} catch (error) {
			this.logger.error(`Error deleting thesis with ID ${id}`, error);

			throw error;
		}
	}
}
