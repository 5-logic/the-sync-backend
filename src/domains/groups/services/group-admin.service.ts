import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

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

			const allExistingGroups = await this.prisma.group.findMany({
				select: { code: true },
			});
			const existingCodes = new Set(allExistingGroups.map((g) => g.code));

			const groupsToCreate: Array<{
				code: string;
				name: string;
				semesterId: string;
			}> = [];

			let currentNumber = nextNumber;
			for (let i = 0; i < dto.numberOfGroup; i++) {
				let code: string;
				do {
					code = currentNumber.toString().padStart(3, '0');
					currentNumber++;
				} while (existingCodes.has(code));

				const name = `Group ${code}`;
				existingCodes.add(code);

				groupsToCreate.push({
					code,
					name,
					semesterId: dto.semesterId,
				});
			}

			const createdGroups = await this.prisma.$transaction(
				async (prisma) => {
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
				},
				{
					timeout: 1200000, // 20 minutes timeout for transaction
				},
			);

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
			const updatedGroups = await this.prisma.$transaction(
				async (prisma) => {
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
				},
				{
					timeout: 1200000, // 20 minutes timeout for transaction
				},
			);

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

	async delete(groupId: string) {
		try {
			this.logger.log(`Deleting group ${groupId}`);

			const group = await this.prisma.group.findUnique({
				where: { id: groupId },
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
					semester: true,
				},
			});

			if (!group) {
				throw new NotFoundException('Group not found');
			}

			if (group.studentGroupParticipations.length > 0) {
				throw new BadRequestException(
					`Cannot delete group ${group.code}. Group contains ${group.studentGroupParticipations.length} student(s)`,
				);
			}

			const deletedGroup = await this.prisma.group.delete({
				where: { id: groupId },
			});

			this.logger.log(
				`Successfully deleted empty group ${deletedGroup.code} from semester ${group.semester.name} (${group.semester.code})`,
			);

			return true;
		} catch (error) {
			this.logger.error(
				`Failed to delete group ${groupId}: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}
}
