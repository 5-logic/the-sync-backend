import { Module } from '@nestjs/common';

import { ThesisController } from '@/theses/thesis.controller';
import { ThesisService } from '@/theses/thesis.service';

@Module({
	controllers: [ThesisController],
	providers: [ThesisService],
})
export class ThesisModule {}
