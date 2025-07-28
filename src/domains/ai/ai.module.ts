import { Module } from '@nestjs/common';

import { AIStudentController, AIThesisController } from '@/ai/controllers';
import { AIStudentService, AIThesisService } from '@/ai/services';

@Module({
	controllers: [AIThesisController, AIStudentController],
	providers: [AIThesisService, AIStudentService],
})
export class AIModule {}
