import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { MilestoneJobProcessor } from '@/queue/milestone/milestone-job.queue';
import { MilestoneJobService } from '@/queue/milestone/milestone-job.service';
import { MILESTONE_QUEUE } from '@/queue/milestone/milestone.constant';

@Module({
	imports: [
		BullModule.registerQueue({
			name: MILESTONE_QUEUE.NAME,
		}),
	],
	providers: [MilestoneJobService, MilestoneJobProcessor],
	exports: [MilestoneJobService],
})
export class MilestoneJobModule {}
