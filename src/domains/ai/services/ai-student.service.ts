import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { GeminiProviderService, PrismaService } from '@/providers';

@Injectable()
export class AIStudentService {
	private readonly logger = new Logger(AIStudentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly gemini: GeminiProviderService,
	) {}

	async suggestStudentsForGroup(groupId: string) {}

	async suggestGroupsForStudent(studentId: string, semesterId: string) {}

	async getGroup(groupId: string): Promise<{ id: string; semesterId: string }> {
		const group = await this.prisma.group.findUnique({
			where: { id: groupId },
			select: {
				id: true,
				semesterId: true,
			},
		});

		if (!group) {
			throw new NotFoundException('Group not found');
		}

		return group;
	}
}
