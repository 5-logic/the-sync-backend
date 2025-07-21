import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';

import { PineconeConfig, pineconeConfig } from '@/configs';

@Injectable()
export class PineconeProviderService {
	private readonly logger = new Logger(PineconeProviderService.name);

	private readonly pineconeClient: Pinecone;

	constructor(
		@Inject(pineconeConfig.KEY)
		private readonly pineconeConfiguration: PineconeConfig,
	) {
		this.pineconeClient = new Pinecone({
			apiKey: pineconeConfiguration.apiKey,
		});

		this.logger.log('Pinecone client initialized successfully.');
		this.logger.debug(
			`Pinecone environment: ${JSON.stringify(pineconeConfiguration)}`,
		);
	}

	getClient(): Pinecone {
		return this.pineconeClient;
	}
}
