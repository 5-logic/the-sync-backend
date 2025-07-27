import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { pineconeConfig } from '@/configs';
import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import {
	PineconeStudentProcessor,
	PineconeThesisProcessor,
} from '@/queue/pinecone/processors';
import {
	PineconeStudentService,
	PineconeThesisService,
} from '@/queue/pinecone/services';

@Global()
@Module({
	imports: [
		ConfigModule.forFeature(pineconeConfig),
		BullModule.registerQueue({
			name: PINECONE_TOKENS.THESIS,
		}),
		BullBoardModule.forFeature({
			name: PINECONE_TOKENS.THESIS,
			adapter: BullMQAdapter,
		}),
		BullModule.registerQueue({
			name: PINECONE_TOKENS.STUDENT,
		}),
		BullBoardModule.forFeature({
			name: PINECONE_TOKENS.STUDENT,
			adapter: BullMQAdapter,
		}),
	],
	providers: [
		PineconeThesisProcessor,
		PineconeThesisService,
		PineconeStudentProcessor,
		PineconeStudentService,
	],
	exports: [PineconeStudentService, PineconeThesisService],
})
export class PineconeModule {}
