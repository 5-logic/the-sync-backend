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

			const codePrefix = `${semester.code}SEAI`;
			const existingGroups = await this.prisma.group.findMany({
				where: {
					semesterId: dto.semesterId,
					code: {
						startsWith: codePrefix,
					},
				},
				select: { code: true },
				orderBy: { code: 'desc' },
			});

			let nextNumber = 1;
			if (existingGroups.length > 0) {
				const lastCode = existingGroups[0].code;
				const lastNumber = parseInt(lastCode.slice(-3));
				if (!isNaN(lastNumber)) {
					nextNumber = lastNumber + 1;
				}
			}

			const groupsToCreate: Array<{
				code: string;
				name: string;
				semesterId: string;
			}> = [];
			for (let i = 0; i < dto.numberOfGroup; i++) {
				const sequentialNumber = (nextNumber + i).toString().padStart(3, '0');
				const code = `${codePrefix}${sequentialNumber}`;
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
}
