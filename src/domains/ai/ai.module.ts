import { Module } from '@nestjs/common';

import { AIStudentController, AIThesisController } from '@/ai/controllers';
import {
	AIStatisticsService,
	AIStudentService,
	AIThesisService,
} from '@/ai/services';

@Module({
	controllers: [AIThesisController, AIStudentController],
	providers: [AIThesisService, AIStudentService, AIStatisticsService],
	exports: [AIStatisticsService],
})
export class AIModule {}
