import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class ThesisService {
	private readonly logger = new Logger(ThesisService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll() {
		try {
			this.logger.log('Fetching all theses');

			const theses = await this.prisma.thesis.findMany({
				include: {
					lecturer: {
						include: {
							user: { select: { id: true } },
						},
					},
					group: true,
					supervisions: {
						include: {
							lecturer: {
								include: {
									user: {
										select: {
											id: true,
											fullName: true,
											email: true,
											phoneNumber: true,
										},
									},
								},
							},
						},
					},
					thesisVersions: true,
					thesisRequiredSkills: {
						include: {
							skill: {
								include: {
									skillSet: { select: { id: true, name: true } },
								},
							},
						},
					},
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
					lecturer: {
						include: {
							user: { select: { id: true } },
						},
					},
					group: true,
					supervisions: {
						include: {
							lecturer: {
								include: {
									user: {
										select: {
											id: true,
											fullName: true,
											email: true,
											phoneNumber: true,
										},
									},
								},
							},
						},
					},
					thesisVersions: true,
					thesisRequiredSkills: {
						include: {
							skill: {
								include: {
									skillSet: { select: { id: true, name: true } },
								},
							},
						},
					},
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
}
