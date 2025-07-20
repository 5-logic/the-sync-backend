import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers';
import { mapThesisDetail } from '@/theses/mappers';
import { ThesisDetailResponse } from '@/theses/responses';

@Injectable()
export class ThesisPublishService {
	private readonly logger = new Logger(ThesisPublishService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll(): Promise<ThesisDetailResponse[]> {
		this.logger.log('Fetching all theses');

		try {
			const theses = await this.prisma.thesis.findMany({
				include: {
					thesisVersions: {
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: true,
						},
					},
					lecturer: {
						include: { user: true },
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${theses.length} theses`);
			this.logger.debug('Theses detail', JSON.stringify(theses));

			const result: ThesisDetailResponse[] = theses.map(mapThesisDetail);

			return result;
		} catch (error) {
			this.logger.error('Error fetching theses', error);

			throw error;
		}
	}

	async findOne(id: string): Promise<ThesisDetailResponse> {
		this.logger.log(`Fetching thesis with id: ${id}`);

		try {
			const thesis = await this.prisma.thesis.findUnique({
				where: { id },
				include: {
					thesisVersions: {
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: true,
						},
					},
					lecturer: {
						include: { user: true },
					},
				},
			});

			if (!thesis) {
				this.logger.warn(`Thesis with ID ${id} not found`);

				throw new NotFoundException(`Thesis not found`);
			}

			this.logger.log(`Thesis found with ID: ${id} (from DB)`);
			this.logger.debug('Thesis detail', JSON.stringify(thesis));

			const result: ThesisDetailResponse = mapThesisDetail(thesis);

			return result;
		} catch (error) {
			this.logger.error(`Error fetching thesis with ID ${id}`, error);

			throw error;
		}
	}

	async findAllBySemesterId(
		semesterId: string,
	): Promise<ThesisDetailResponse[]> {
		this.logger.log(`Fetching all theses for semester with ID: ${semesterId}`);

		try {
			const theses = await this.prisma.thesis.findMany({
				where: { semesterId },
				include: {
					thesisVersions: {
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: true,
						},
					},
					lecturer: {
						include: { user: true },
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(
				`Found ${theses.length} theses for semester ${semesterId}`,
			);
			this.logger.debug('Theses detail', JSON.stringify(theses));

			const result: ThesisDetailResponse[] = theses.map(mapThesisDetail);

			return result;
		} catch (error) {
			this.logger.error(
				`Error fetching theses for semester with ID ${semesterId}`,
				error,
			);

			throw error;
		}
	}
}
