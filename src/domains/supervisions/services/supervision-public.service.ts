import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class SupervisionPublicService {
	private readonly logger = new Logger(SupervisionPublicService.name);

	constructor(private readonly prisma: PrismaService) {}

	async getSupervisionsByThesis(thesisId: string) {
		try {
			this.logger.log(`Getting supervisions for thesis ${thesisId}`);

			const supervisions = await this.prisma.supervision.groupBy({
				where: { thesisId },
				by: ['lecturerId'],
			});

			this.logger.log(
				`Found ${supervisions.length} supervisions for thesis ${thesisId}`,
			);

			return supervisions;
		} catch (error) {
			this.logger.error(
				`Failed to get supervisions for thesis ${thesisId}`,
				error,
			);
			throw error;
		}
	}

	async getSupervisionsByLecturer(lecturerId: string) {
		try {
			this.logger.log(`Getting supervisions for lecturer ${lecturerId}`);

			const supervisions = await this.prisma.supervision.groupBy({
				where: { lecturerId },
				by: ['thesisId'],
			});

			this.logger.log(
				`Found ${supervisions.length} supervisions for lecturer ${lecturerId}`,
			);

			return supervisions;
		} catch (error) {
			this.logger.error(
				`Failed to get supervisions for lecturer ${lecturerId}`,
				error,
			);
			throw error;
		}
	}

	async getSupervisionsGroupByLecturer(lecturerId: string) {
		try {
			this.logger.log(`Getting supervisions grouped by lecturer ${lecturerId}`);

			const supervisions = await this.prisma.supervision.findMany({
				where: {
					lecturerId,
					thesis: {
						groupId: { not: null },
					},
				},
				include: {
					thesis: {
						include: {
							group: {
								include: {
									studentGroupParticipations: {
										include: {
											student: {
												include: {
													user: true,
												},
											},
										},
									},
								},
							},
						},
					},
				},
			});

			this.logger.log(
				`Found ${supervisions.length} supervisions grouped by lecturer ${lecturerId} (only thesis with group pick)`,
			);

			return supervisions;
		} catch (error) {
			this.logger.error(
				`Failed to get supervisions grouped by lecturer ${lecturerId}`,
				error,
			);
			throw error;
		}
	}
}
