/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';
import { SelfUpdateStudentDto } from '@/students/dtos';

@Injectable()
export class StudentSelfService {
	private readonly logger = new Logger(StudentSelfService.name);

	constructor(private readonly prisma: PrismaService) {}

	async update(id: string, dto: SelfUpdateStudentDto) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
}
