import { Injectable, Logger } from '@nestjs/common';

import { CreateManyGroupDto } from '@/groups/dtos';
import { PrismaService } from '@/providers';

@Injectable()
export class GroupAdminService {
	private readonly logger = new Logger(GroupAdminService.name);

	constructor(private readonly prisma: PrismaService) {}

	async createMany(dto: CreateManyGroupDto) {
		try {
			this.logger.log(
				`Creating ${dto.numberOfGroup} groups for semester ${dto.semesterId}`,
			);

			const semester = await this.prisma.semester.findUnique({
				where: { id: dto.semesterId },
			});

			if (!semester) {
				throw new Error('Semester not found');
			}

			const existingGroups = await this.prisma.group.findMany({
				where: {
					semesterId: dto.semesterId,
				},
				select: { code: true },
				orderBy: { code: 'desc' },
			});

			let nextNumber = 1;
			if (existingGroups.length > 0) {
				const numbers = existingGroups
					.map((group) => parseInt(group.code))
					.filter((num) => !isNaN(num));

				if (numbers.length > 0) {
					nextNumber = Math.max(...numbers) + 1;
				}
			}

			const groupsToCreate: Array<{
				code: string;
				name: string;
				semesterId: string;
			}> = [];
			for (let i = 0; i < dto.numberOfGroup; i++) {
				const sequentialNumber = (nextNumber + i).toString().padStart(3, '0');
				const code = sequentialNumber;
				const name = `Group ${code}`;

				groupsToCreate.push({
					code,
					name,
					semesterId: dto.semesterId,
				});
			}

			const createdGroups = await this.prisma.$transaction(async (prisma) => {
				const results: Array<{
					id: string;
					code: string;
					name: string;
					projectDirection: string | null;
					semesterId: string;
					thesisId: string | null;
					createdAt: Date;
					updatedAt: Date;
				}> = [];
				for (const groupData of groupsToCreate) {
					const group = await prisma.group.create({
						data: groupData,
					});
					results.push(group);
				}
				return results;
			});

			this.logger.log(
				`Successfully created ${createdGroups.length} groups for semester ${semester.name} (${semester.code})`,
			);

			return createdGroups;
		} catch (error) {
			this.logger.error(
				`Failed to create groups: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}

	async formatGroup(semesterId: string) {
		try {
			this.logger.log(`Formatting groups for semester ${semesterId}`);

			const semester = await this.prisma.semester.findUnique({
				where: { id: semesterId },
			});

			if (!semester) {
				throw new Error('Semester not found');
			}

			const groups = await this.prisma.group.findMany({
				where: {
					semesterId: semesterId,
				},
				include: {
					studentGroupParticipations: {
						include: {
							student: true,
						},
					},
				},
				orderBy: { createdAt: 'asc' },
			});

			if (groups.length === 0) {
				this.logger.log('No groups found in this semester');
				return [];
			}

			const sortedGroups = groups.sort((a, b) => {
				const aHasStudents = a.studentGroupParticipations.length > 0;
				const bHasStudents = b.studentGroupParticipations.length > 0;

				if (aHasStudents && !bHasStudents) return -1;
				if (!aHasStudents && bHasStudents) return 1;

				const aCodeNumber = parseInt(a.code) || 0;
				const bCodeNumber = parseInt(b.code) || 0;
				return aCodeNumber - bCodeNumber;
			});

			const codePrefix = `${semester.code}SEAI`;
			const updatedGroups = await this.prisma.$transaction(async (prisma) => {
				const results: any[] = [];

				for (let i = 0; i < sortedGroups.length; i++) {
					const group = sortedGroups[i];
					const sequentialNumber = (i + 1).toString().padStart(3, '0');
					const newCode = `${codePrefix}${sequentialNumber}`;

					const updatedGroup = await prisma.group.update({
						where: { id: group.id },
						data: {
							code: newCode,
						},
						include: {
							studentGroupParticipations: {
								include: {
									student: {
										include: {
											user: {
												omit: { password: true },
											},
										},
									},
								},
							},
						},
					});

					results.push(updatedGroup);
				}

				return results;
			});

			this.logger.log(
				`Successfully formatted ${updatedGroups.length} groups for semester ${semester.name} (${semester.code})`,
			);

			return updatedGroups;
		} catch (error) {
			this.logger.error(
				`Failed to format groups: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}
}
