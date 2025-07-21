/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';

import {
	ChangeLeaderDto,
	CreateGroupDto,
	PickThesisDto,
	RemoveStudentDto,
	UpdateGroupDto,
} from '@/groups/dtos';
import { PrismaService } from '@/providers';

@Injectable()
export class GroupStudentService {
	private readonly logger = new Logger(GroupStudentService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(studentId: string, dto: CreateGroupDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async update(groupId: string, studentId: string, dto: UpdateGroupDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async changeLeader(groupId: string, studentId: string, dto: ChangeLeaderDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async removeStudent(
		groupId: string,
		studentId: string,
		dto: RemoveStudentDto,
	) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async leaveGroup(groupId: string, studentId: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async pickThesis(groupId: string, studentId: string, dto: PickThesisDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async unpickThesis(groupId: string, studentId: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async delete(id: string, studentId: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async findDetailedByStudentId(studentId: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
}
