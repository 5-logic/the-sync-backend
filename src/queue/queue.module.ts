import { Module } from '@nestjs/common';

import { EmailModule } from '@/queue/email';
import { MilestoneJobModule } from '@/queue/milestone';
import { PineconeModule } from '@/queue/pinecone';

@Module({
	imports: [EmailModule, PineconeModule, MilestoneJobModule],
	exports: [EmailModule, PineconeModule, MilestoneJobModule],
})
export class QueueModule {}
