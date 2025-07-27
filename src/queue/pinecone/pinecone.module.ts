import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { pineconeConfig } from '@/configs';
import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import {
	PineconeGroupProcessor,
	PineconeStudentProcessor,
	PineconeThesisProcessor,
} from '@/queue/pinecone/processors';
import {
	PineconeGroupService,
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
		BullModule.registerQueue({
			name: PINECONE_TOKENS.GROUP,
		}),
		BullBoardModule.forFeature({
			name: PINECONE_TOKENS.GROUP,
			adapter: BullMQAdapter,
		}),
	],
	providers: [
		PineconeThesisProcessor,
		PineconeThesisService,
		PineconeStudentProcessor,
		PineconeStudentService,
		PineconeGroupProcessor,
		PineconeGroupService,
	],
	exports: [
		PineconeStudentService,
		PineconeThesisService,
		PineconeGroupService,
	],
})
export class PineconeModule {}
