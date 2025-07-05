import { Module } from '@nestjs/common';

import { EmailModule } from '@/queue/email/email.module';

import { SupervisionController } from '~/src/domains/supervisions/supervision.controller';
import { SupervisionService } from '~/src/domains/supervisions/supervision.service';

@Module({
	imports: [EmailModule],
	controllers: [SupervisionController],
	providers: [SupervisionService],
})
export class SupervisionModule {}
