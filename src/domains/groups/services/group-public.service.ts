import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { mapGroup, mapGroupDetail } from '@/groups/mappers';
import { GroupDetailResponse, GroupResponse } from '@/groups/responses';
import { PrismaService } from '@/providers';

@Injectable()
export class GroupPublicService {
	private readonly logger = new Logger(GroupPublicService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll(): Promise<GroupResponse[]> {
		this.logger.log('Fetching all groups');

		try {
			const groups = await this.prisma.group.findMany({
				include: {
					semester: true,
					thesis: true,
					_count: {
						select: { studentGroupParticipations: true },
					},
					studentGroupParticipations: {
						where: { isLeader: true },
						include: { student: { include: { user: true } } },
						take: 1,
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${groups.length} groups`);
			this.logger.debug('Groups:', JSON.stringify(groups));

			const result: GroupResponse[] = groups.map(mapGroup);

			return result;
		} catch (error) {
			this.logger.error('Error fetching groups', error);

			throw error;
		}
	}

	async findOne(id: string): Promise<GroupDetailResponse> {
		this.logger.log(`Fetching group with id: ${id}`);

		try {
			const group = await this.prisma.group.findUnique({
				where: { id: id },
				include: {
					semester: true,
					thesis: true,
					groupRequiredSkills: {
						include: { skill: { include: { skillSet: true } } },
					},
					groupExpectedResponsibilities: {
						include: { responsibility: true },
					},
					studentGroupParticipations: {
						include: {
							student: { include: { user: true, major: true } },
						},
					},
				},
			});

			if (!group) {
				this.logger.warn(`Group with id ${id} not found`);

				throw new NotFoundException(`Group not found`);
			}

			this.logger.log(`Found group with id: ${id}`);
			this.logger.debug('Group details:', JSON.stringify(group));

			const result: GroupDetailResponse = mapGroupDetail(group);

			return result;
		} catch (error) {
			this.logger.error(`Error fetching group with id ${id}`, error);

			throw error;
		}
	}

	async findGroupMembers(id: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async findGroupSkillsAndResponsibilities(id: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async findDetailedByStudentId(studentId: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
}
