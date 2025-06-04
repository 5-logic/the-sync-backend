import { Module } from '@nestjs/common';

import { MilestoneController } from '@/milestones/milestone.controller';
import { MilestoneService } from '@/milestones/milestone.service';
import { PrismaService } from '@/providers/prisma.service';

@Module({
	controllers: [MilestoneController],
	providers: [MilestoneService, PrismaService],
})
export class MilestoneModule {}
