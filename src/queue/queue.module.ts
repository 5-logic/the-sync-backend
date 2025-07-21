import { Module } from '@nestjs/common';

import { EmailModule } from '@/queue/email';
import { PineconeModule } from '@/queue/pinecone';

@Module({
	imports: [EmailModule, PineconeModule],
	exports: [EmailModule, PineconeModule],
})
export class QueueModule {}
