import { Module } from '@nestjs/common';

import {
	MilestoneAdminController,
	MilestonePublicController,
} from '@/milestones/controllers';
import {
	MilestoneAdminService,
	MilestonePublicService,
	MilestoneService,
} from '@/milestones/services';

@Module({
	controllers: [MilestoneAdminController, MilestonePublicController],
	providers: [MilestoneService, MilestoneAdminService, MilestonePublicService],
})
export class MilestoneModule {}
