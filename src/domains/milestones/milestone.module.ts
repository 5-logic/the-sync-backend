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

@Module({
	controllers: [MilestoneAdminController, MilestonePublicController],
	providers: [MilestoneService, MilestoneAdminService, MilestonePublicService],
})
export class MilestoneModule {}
