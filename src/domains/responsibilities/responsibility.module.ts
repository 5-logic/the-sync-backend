import { Module } from '@nestjs/common';

import { ResponsibilityController } from '@/responsibilities/controllers';
import { ResponsibilityService } from '@/responsibilities/services';

@Module({
	controllers: [ResponsibilityController],
	providers: [ResponsibilityService],
})
export class ResponsibilityModule {}
