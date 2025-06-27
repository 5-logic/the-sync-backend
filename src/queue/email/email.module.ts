import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CONFIG_QUEUES, emailConfig } from '@/configs';
import { EmailQueueService } from '@/email/email-queue.service';
import { EmailConsumer } from '@/email/email.processor';

@Global()
@Module({
	imports: [
		ConfigModule.forFeature(emailConfig),
		BullModule.registerQueue({
			name: CONFIG_QUEUES.EMAIL,
		}),
		BullBoardModule.forFeature({
			name: CONFIG_QUEUES.EMAIL,
			adapter: BullMQAdapter,
		}),
	],
	providers: [EmailQueueService, EmailConsumer],
	exports: [EmailQueueService],
})
export class EmailModule {}
