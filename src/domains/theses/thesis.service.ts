import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';
import { CreateThesisDto } from '@/theses/dto/create-thesis.dto';
import { UpdateThesisDto } from '@/theses/dto/update-thesis.dto';

@Injectable()
export class ThesisService {
	private readonly logger = new Logger(ThesisService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createThesisDto: CreateThesisDto, userId: string): Promise<any> {
		try {
			const existingUser = await this.prisma.user.findUnique({
				where: { id: userId },
			});

			if (!existingUser) {
				this.logger.warn(`User with ID ${userId} not found`);
				throw new Error(`User with ID ${userId} not found`);
			}

			const newThesis = await this.prisma.thesis.create({
				data: { ...createThesisDto, userId },
				include: { group: { select: { id: true } } },
			});

			this.logger.log(`Thesis created with ID: ${newThesis.id}`);
			this.logger.debug(`Thesis`, newThesis);

			return {
				...newThesis,
				group: newThesis.group?.id ?? null,
			};
		} catch (error) {
			this.logger.error('Error creating thesis', error);
			throw error;
		}
	}

	async findAll(): Promise<any[]> {
		try {
			const theses = await this.prisma.thesis.findMany({
				include: { group: { select: { id: true } } },
			});

			this.logger.log(`Found ${theses.length} theses`);

			return theses.map((t) => ({
				...t,
				group: t.group?.id ?? null,
			}));
		} catch (error) {
			this.logger.error('Error fetching theses', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<any> {
		try {
			const thesis = await this.prisma.thesis.findUnique({
				where: { id },
				include: { group: { select: { id: true } } },
			});

			if (!thesis) {
				this.logger.warn(`Thesis with ID ${id} not found`);
				return null;
			} else {
				this.logger.log(`Thesis found with ID: ${thesis.id}`);
			}

			return {
				...thesis,
				group: thesis.group?.id ?? null,
			};
		} catch (error) {
			this.logger.error(`Error fetching thesis with ID ${id}`, error);
			throw error;
		}
	}

	async update(
		id: string,
		updateThesisDto: UpdateThesisDto,
		userId: string,
	): Promise<any> {
		try {
			const updatedThesis = await this.prisma.thesis.update({
				where: { id },
				data: { ...updateThesisDto, userId },
				include: { group: { select: { id: true } } },
			});

			this.logger.log(`Thesis updated with ID: ${updatedThesis.id}`);
			this.logger.debug(`Updated Thesis`, updatedThesis);

			return {
				...updatedThesis,
				group: updatedThesis.group?.id ?? null,
			};
		} catch (error) {
			this.logger.error(`Error updating thesis with ID ${id}`, error);
			throw error;
		}
	}

	async remove(id: string): Promise<any> {
		try {
			const deletedThesis = await this.prisma.thesis.delete({
				where: { id },
				include: { group: { select: { id: true } } },
			});

			this.logger.log(`Thesis deleted with ID: ${deletedThesis.id}`);

			return {
				status: 'success',
				message: `Thesis with ID ${deletedThesis.id} deleted successfully`,
			};
		} catch (error) {
			this.logger.error(`Error deleting thesis with ID ${id}`, error);
			throw error;
		}
	}

	// ...existing code...
}
