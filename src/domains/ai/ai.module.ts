import { Module } from '@nestjs/common';

import { AIStudentController, AIThesisController } from '@/ai/controllers';
import { AILoggingInterceptor } from '@/ai/interceptors';
import {
	AIStatisticsService,
	AIStudentService,
	AIThesisService,
} from '@/ai/services';

@Module({
	controllers: [AIThesisController, AIStudentController],
	providers: [
		AIThesisService,
		AIStudentService,
		AIStatisticsService,
		AILoggingInterceptor,
	],
	exports: [AIStatisticsService, AILoggingInterceptor],
})
export class AIModule {}
