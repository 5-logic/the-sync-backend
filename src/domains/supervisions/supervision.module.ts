import { Module } from '@nestjs/common';

import {
	SupervisionModeratorController,
	SupervisionPublicController,
} from '@/supervisions/controllers';
import {
	SupervisionModeratorService,
	SupervisionPublicService,
} from '@/supervisions/services';
import { SupervisionService } from '@/supervisions/services/supervision.service';

@Module({
	controllers: [SupervisionModeratorController, SupervisionPublicController],
	providers: [
		SupervisionModeratorService,
		SupervisionPublicService,
		SupervisionService,
	],
})
export class SupervisionModule {}
