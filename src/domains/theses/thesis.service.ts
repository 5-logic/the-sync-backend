import {
	ConflictException,
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
	private readonly INITIAL_VERSION = 1;
	constructor(private readonly prisma: PrismaService) {}

	async create(lecturerId: string, dto: CreateThesisDto) {
		try {
			const {
				supportingDocument,
				englishName,
				vietnameseName,
				abbreviation,
				description,
				domain,
			} = dto;

			const newThesis = await this.prisma.$transaction(async (prisma) => {
				// Create thesis
				const thesis = await prisma.thesis.create({
					data: {
						englishName,
						vietnameseName,
						abbreviation,
						description,
						domain,
						lecturerId,
					},
				});

				// Create the first thesis version
				await prisma.thesisVersion.create({
					data: {
						version: this.INITIAL_VERSION,
						supportingDocument,
						thesisId: thesis.id,
					},
				});

				// Return thesis with version information
				return prisma.thesis.findUnique({
					where: { id: thesis.id },
					include: {
						thesisVersions: {
							select: { id: true, version: true, supportingDocument: true },
							orderBy: { version: 'desc' },
						},
					},
				});
			});

			if (!newThesis) {
				throw new ConflictException('Failed to create thesis');
			}

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
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
						orderBy: { version: 'desc' },
					},
				},
				orderBy: { createdAt: 'desc' },
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
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
					},
				},
			});

			if (!thesis) {
				this.logger.warn(`Thesis with ID ${id} not found`);

				throw new NotFoundException(`Thesis with ID ${id} not found`);
			}

			this.logger.log(`Thesis found with ID: ${id}`);
			this.logger.debug('Thesis detail', thesis);

			return thesis;
		} catch (error) {
			this.logger.error(`Error fetching thesis with ID ${id}`, error);

			throw error;
		}
	}

	async update(lecturerId: string, id: string, dto: UpdateThesisDto) {
		try {
			this.logger.log(
				`Updating thesis with ID: ${id} by lecturer with ID: ${lecturerId}`,
			);

			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
				include: {
					thesisVersions: {
						select: { version: true },
						orderBy: { version: 'desc' },
						take: 1,
					},
				},
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with ID ${id} not found for update`);

				throw new NotFoundException(`Thesis with ID ${id} not found`);
			}

			if (existingThesis.lecturerId !== lecturerId) {
				this.logger.warn(
					`Lecturer with ID ${lecturerId} is not authorized to update thesis with ID ${id}`,
				);

				throw new ForbiddenException(
					`You do not have permission to update this thesis`,
				);
			}

			const {
				supportingDocument,
				englishName,
				vietnameseName,
				abbreviation,
				description,
				domain,
			} = dto;

			const updatedThesis = await this.prisma.$transaction(async (prisma) => {
				// Update thesis data (excluding supportingDocument)
				await prisma.thesis.update({
					where: { id },
					data: {
						englishName,
						vietnameseName,
						abbreviation,
						description,
						domain,
					},
				});

				// If supportingDocument is provided, create a new version
				if (supportingDocument) {
					const latestVersion =
						existingThesis.thesisVersions[0]?.version ?? this.INITIAL_VERSION;
					const newVersion = latestVersion + 1;

					await prisma.thesisVersion.create({
						data: {
							version: newVersion,
							supportingDocument,
							thesisId: id,
						},
					});

					this.logger.log(
						`Created new thesis version ${newVersion} for thesis ID: ${id}`,
					);
				}

				// Return updated thesis with all versions
				return prisma.thesis.findUnique({
					where: { id },
					include: {
						thesisVersions: {
							select: { id: true, version: true, supportingDocument: true },
							orderBy: { version: 'desc' },
						},
					},
				});
			});

			if (!updatedThesis) {
				throw new ConflictException('Failed to update thesis');
			}

			this.logger.log(`Thesis updated with ID: ${updatedThesis.id}`);
			this.logger.debug('Updated thesis detail', updatedThesis);

			return updatedThesis;
		} catch (error) {
			this.logger.error(`Error updating thesis with ID ${id}`, error);

			throw error;
		}
	}
}
