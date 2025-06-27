import { Module } from '@nestjs/common';

import { MilestoneController } from '@/milestones/milestone.controller';
import { MilestoneService } from '@/milestones/milestone.service';

@Module({
	controllers: [MilestoneController],
	providers: [MilestoneService],
})
export class MilestoneModule {}
