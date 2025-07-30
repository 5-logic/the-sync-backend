import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class GroupLecturerService {
	private readonly logger = new Logger(GroupLecturerService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findSupervisedGroups(userId: string, semesterId: string) {
		try {
			const supervisedThesisIds = await this.prisma.supervision.findMany({
				where: {
					lecturerId: userId,
					thesis: {
						semesterId: semesterId,
					},
				},
				select: { thesisId: true },
			});

			const thesisIds = supervisedThesisIds.map((s) => s.thesisId);
			if (thesisIds.length === 0) return [];

			const groups = await this.prisma.group.findMany({
				where: {
					semesterId: semesterId,
					thesisId: { in: thesisIds },
				},
				include: {
					thesis: {
						include: {
							lecturer: {
								include: {
									user: true,
								},
							},
							thesisRequiredSkills: {
								include: {
									skill: {
										include: {
											skillSet: true,
										},
									},
								},
							},
						},
					},
					semester: true,
					studentGroupParticipations: {
						include: {
							student: {
								include: {
									user: true,
									major: true,
								},
							},
						},
					},
					groupRequiredSkills: {
						include: {
							skill: {
								include: {
									skillSet: true,
								},
							},
						},
					},
					groupExpectedResponsibilities: {
						include: {
							responsibility: true,
						},
					},
				},
			});
			return groups;
		} catch (error) {
			this.logger.error(
				`Failed to find supervised groups for user ${userId} in semester ${semesterId}`,
				error,
			);
			throw error;
		}
	}
}
