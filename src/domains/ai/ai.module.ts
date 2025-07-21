import { Module } from '@nestjs/common';

import { AIThesisController } from '@/ai/controllers';
import { AIThesisService } from '@/ai/services';

@Module({
	controllers: [AIThesisController],
	providers: [AIThesisService],
})
export class AIModule {}
