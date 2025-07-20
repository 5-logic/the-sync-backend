import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class ThesisPublishService {
	private readonly logger = new Logger(ThesisPublishService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll() {
		try {
			this.logger.log('Fetching all theses');

			// No cache for list operations to ensure real-time data
			const theses = await this.prisma.thesis.findMany({
				include: {
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: {
								select: {
									id: true,
									name: true,
								},
							},
						},
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
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			});

			if (!thesis) {
				this.logger.warn(`Thesis with ID ${id} not found`);
				throw new NotFoundException(`Thesis not found`);
			}

			this.logger.log(`Thesis found with ID: ${id} (from DB)`);
			this.logger.debug('Thesis detail', thesis);
			return thesis;
		} catch (error) {
			this.logger.error(`Error fetching thesis with ID ${id}`, error);
			throw error;
		}
	}

	async findAllBySemesterId(semesterId: string) {
		try {
			this.logger.log(
				`Fetching all theses for semester with ID: ${semesterId}`,
			);

			// No cache for list operations to ensure real-time data
			const theses = await this.prisma.thesis.findMany({
				where: { semesterId },
				include: {
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
					lecturer: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(
				`Found ${theses.length} theses for semester ${semesterId}`,
			);
			this.logger.debug('Theses detail', theses);

			return theses;
		} catch (error) {
			this.logger.error(
				`Error fetching theses for semester with ID ${semesterId}`,
				error,
			);

			throw error;
		}
	}
}
