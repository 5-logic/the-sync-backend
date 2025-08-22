import { Module } from '@nestjs/common';

import {
	MilestoneAdminController,
	MilestonePublicController,
} from '@/milestones/controllers';
import {
	MilestoneAdminService,
	MilestonePublicService,
} from '@/milestones/services';
import { MilestoneService } from '@/milestones/services/milestone.service';
import { MilestoneJobModule } from '@/queue/milestone';

@Module({
	imports: [MilestoneJobModule],
	controllers: [MilestoneAdminController, MilestonePublicController],
	providers: [MilestoneService, MilestoneAdminService, MilestonePublicService],
})
export class MilestoneModule {}
