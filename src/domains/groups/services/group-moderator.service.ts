/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';

import { AssignStudentDto } from '@/groups/dtos';
import { PrismaService } from '@/providers';

@Injectable()
export class GroupModeratorService {
	private readonly logger = new Logger(GroupModeratorService.name);

	constructor(private readonly prisma: PrismaService) {}

	async assignStudent(groupId: string, dto: AssignStudentDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
}
