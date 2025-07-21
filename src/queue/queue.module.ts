import { Module } from '@nestjs/common';

import { EmailModule } from '@/email/email.module';
import { PineconeModule } from '@/queue/pinecone';

@Module({
	imports: [EmailModule, PineconeModule],
	exports: [EmailModule, PineconeModule],
})
export class QueueModule {}
