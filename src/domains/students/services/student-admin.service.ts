/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';
import {
	CreateStudentDto,
	ImportStudentDto,
	ToggleStudentStatusDto,
	UpdateStudentDto,
} from '@/students/dtos';

@Injectable()
export class StudentAdminService {
	private readonly logger = new Logger(StudentAdminService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(dto: CreateStudentDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async createMany(dto: ImportStudentDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async updateByAdmin(id: string, dto: UpdateStudentDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async toggleStatus(id: string, dto: ToggleStudentStatusDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async delete(id: string, semesterId: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
}
