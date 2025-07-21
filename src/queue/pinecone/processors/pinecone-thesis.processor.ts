import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import { ThesisDetailResponse } from '@/theses/responses';

@Processor(PINECONE_TOKENS.THESIS)
export class PineconeThesisProcessor extends WorkerHost {
	private readonly logger = new Logger(PineconeThesisProcessor.name);

	constructor() {
		super();
	}

	process(job: Job<ThesisDetailResponse>): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
