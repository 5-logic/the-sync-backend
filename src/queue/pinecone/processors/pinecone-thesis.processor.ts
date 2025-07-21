import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { Job } from 'bullmq';

import { PineconeConfig, pineconeConfig } from '@/configs';
import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import { ThesisDetailResponse } from '@/theses/responses';

@Processor(PINECONE_TOKENS.THESIS)
export class PineconeThesisProcessor extends WorkerHost {
	private readonly logger = new Logger(PineconeThesisProcessor.name);

	private readonly pineconeClient: Pinecone;

	constructor(
		@Inject(pineconeConfig.KEY)
		private readonly pineconeConfiguration: PineconeConfig,
	) {
		super();

		this.pineconeClient = new Pinecone({
			apiKey: pineconeConfiguration.apiKey,
		});

		this.logger.log('Pinecone client initialized successfully.');
		this.logger.debug(
			`Pinecone environment: ${JSON.stringify(pineconeConfiguration.apiKey)}`,
		);
	}

	process(job: Job<ThesisDetailResponse>): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
