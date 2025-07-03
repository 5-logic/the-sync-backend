import { Module } from '@nestjs/common';

import { EmailModule } from '@/queue/email/email.module';
import { SupervisionsController } from '@/supervisions/supervisions.controller';
import { SupervisionsService } from '@/supervisions/supervisions.service';

@Module({
	imports: [EmailModule],
	controllers: [SupervisionsController],
	providers: [SupervisionsService],
})
export class SupervisionsModule {}
