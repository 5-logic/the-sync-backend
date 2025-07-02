import { Module } from '@nestjs/common';

import { SupervisionsController } from '@/supervisions/supervisions.controller';
import { SupervisionsService } from '@/supervisions/supervisions.service';

@Module({
	controllers: [SupervisionsController],
	providers: [SupervisionsService],
})
export class SupervisionsModule {}
