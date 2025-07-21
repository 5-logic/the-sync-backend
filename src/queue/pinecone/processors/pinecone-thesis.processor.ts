import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { Job } from 'bullmq';

import { PineconeConfig, pineconeConfig } from '@/configs';
import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import { PineconeJobType } from '@/queue/pinecone/enums';
import { ThesisDetailResponse } from '@/theses/responses';

@Processor(PINECONE_TOKENS.THESIS)
export class PineconeThesisProcessor extends WorkerHost {
	private static readonly NAMESPACE = PINECONE_TOKENS.THESIS + ':namespace';

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

	async process(job: Job<ThesisDetailResponse>): Promise<void> {
		try {
			switch (job.name as PineconeJobType) {
				case PineconeJobType.CREATE_OR_UPDATE: {
					await this.createOrUpdate(job.data);
					break;
				}
				case PineconeJobType.DELETE: {
					await this.delete(job.data);
					break;
				}

				default: {
					this.logger.warn(`Unknown job type: ${job.name}`);

					throw new Error(`Unknown job type: ${job.name}`);
				}
			}
		} catch (error) {
			this.logger.error(`Failed to process job ${job.id}:`, error);

			throw error;
		}
	}

	async createOrUpdate(dto: ThesisDetailResponse): Promise<void> {
		throw new Error('Method not implemented.');
	}

	async delete(dto: ThesisDetailResponse): Promise<void> {
		const index = this.pineconeClient
			.Index(this.pineconeConfiguration.indexName)
			.namespace(PineconeThesisProcessor.NAMESPACE);

		await index.deleteOne(dto.id);
	}
}
