import { Module } from '@nestjs/common';

import { EmailModule } from '@/queue/email/email.module';
import { ThesisController } from '@/theses/thesis.controller';
import { ThesisService } from '@/theses/thesis.service';

@Module({
	imports: [EmailModule],
	controllers: [ThesisController],
	providers: [ThesisService],
})
export class ThesisModule {}
