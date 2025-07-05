import { Module } from '@nestjs/common';

import { SupervisionController } from '@/domains/supervisions/supervision.controller';
import { SupervisionService } from '@/domains/supervisions/supervision.service';
import { EmailModule } from '@/queue/email/email.module';

@Module({
	imports: [EmailModule],
	controllers: [SupervisionController],
	providers: [SupervisionService],
})
export class SupervisionModule {}
