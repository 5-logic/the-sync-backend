import { Injectable, Logger } from '@nestjs/common';

import { GroupResponse } from '@/groups/responses';
import { PrismaService } from '@/providers';

@Injectable()
export class GroupPublicService {
	private readonly logger = new Logger(GroupPublicService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll(): Promise<GroupResponse[]> {
		this.logger.log('Fetching all groups');

		try {
			const groups = await this.prisma.group.findMany();

			this.logger.log(`Found ${groups.length} groups`);
			this.logger.debug('Groups:', JSON.stringify(groups));

			const result: GroupResponse[] = [];

			return result;
		} catch (error) {
			this.logger.error('Error fetching groups', error);

			throw error;
		}
	}

	async findOne(id: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
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
