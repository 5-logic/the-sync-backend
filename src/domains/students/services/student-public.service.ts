/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class StudentPublicService {
	private readonly logger = new Logger(StudentPublicService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll() {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async findOne(id: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async findAllBySemester(semesterId: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async findStudentsWithoutGroup(semesterId: string) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
}
