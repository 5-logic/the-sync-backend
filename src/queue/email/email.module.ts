import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CONFIG_QUEUES } from '@/configs';
import { EmailQueueService } from '@/email/email-queue.service';
import { EmailProcessor } from '@/email/email.processor';

@Module({
	imports: [
		BullModule.registerQueue({
			name: CONFIG_QUEUES.EMAIL,
		}),
		BullBoardModule.forFeature({
			name: CONFIG_QUEUES.EMAIL,
			adapter: BullMQAdapter,
		}),
	],
	providers: [EmailQueueService, EmailProcessor],
	exports: [EmailQueueService],
})
export class EmailModule {}
