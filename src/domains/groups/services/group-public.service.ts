/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class GroupPublicService {
	private readonly logger = new Logger(GroupPublicService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll() {
		await new Promise((resolve) => setTimeout(resolve, 10));
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
