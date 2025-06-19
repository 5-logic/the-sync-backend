import {
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateThesisDto } from '@/theses/dto/create-thesis.dto';
import { UpdateThesisDto } from '@/theses/dto/update-thesis.dto';

@Injectable()
export class ThesisService {
	private readonly logger = new Logger(ThesisService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(lecturerId: string, createThesisDto: CreateThesisDto) {
		try {
			const newThesis = await this.prisma.thesis.create({
				data: { ...createThesisDto, lecturerId },
				include: {
					thesisVersions: { select: { id: true } },
				},
			});

			this.logger.log(`Thesis created with ID: ${newThesis.id}`);
			this.logger.debug('Thesis detail', newThesis);

			return newThesis;
		} catch (error) {
			this.logger.error('Error creating thesis', error);

			throw error;
		}
	}

	async findAll() {
		try {
			this.logger.log('Fetching all theses');

			const theses = await this.prisma.thesis.findMany({
				include: {
					thesisVersions: { select: { id: true } },
				},
			});

			this.logger.log(`Found ${theses.length} theses`);
			this.logger.debug('Theses detail', theses);

			return theses;
		} catch (error) {
			this.logger.error('Error fetching theses', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			this.logger.log(`Fetching thesis with id: ${id}`);

			const thesis = await this.prisma.thesis.findUnique({
				where: { id },
				include: {
					thesisVersions: { select: { id: true } },
				},
			});

			if (!thesis) {
				this.logger.warn(`Thesis with id ${id} not found`);

				throw new NotFoundException(`Thesis with id ${id} not found`);
			}

			this.logger.log(`Thesis found with id: ${id}`);
			this.logger.debug('Thesis detail', thesis);

			return thesis;
		} catch (error) {
			this.logger.error(`Error fetching thesis with id ${id}`, error);
			throw error;
		}
	}

	async update(
		lecturerId: string,
		id: string,
		updateThesisDto: UpdateThesisDto,
	) {
		try {
			this.logger.log(
				`Updating thesis with id: ${id} by lecturer with id: ${lecturerId}`,
			);

			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with id ${id} not found for update`);

				throw new NotFoundException(`Thesis with id ${id} not found`);
			}

			if (existingThesis.lecturerId !== lecturerId) {
				this.logger.warn(
					`Lecturer with id ${lecturerId} is not authorized to update thesis with id ${id}`,
				);

				throw new ForbiddenException(
					`You do not have permission to update this thesis`,
				);
			}

			const updatedThesis = await this.prisma.thesis.update({
				where: { id },
				data: updateThesisDto,
				include: {
					thesisVersions: { select: { id: true } },
				},
			});

			this.logger.log(`Thesis updated with ID: ${updatedThesis.id}`);
			this.logger.debug('Updated thesis detail', updatedThesis);

			return updatedThesis;
		} catch (error) {
			this.logger.error(`Error updating thesis with id ${id}`, error);

			throw error;
		}
	}
}
