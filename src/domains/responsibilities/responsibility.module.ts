import { Module } from '@nestjs/common';

import { ResponsibilityController } from '@/responsibilities/responsibility.controller';
import { ResponsibilityService } from '@/responsibilities/responsibility.service';

@Module({
	controllers: [ResponsibilityController],
	providers: [ResponsibilityService],
})
export class ResponsibilityModule {}
