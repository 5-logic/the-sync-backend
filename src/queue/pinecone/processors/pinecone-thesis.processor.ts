import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { Job } from 'bullmq';
import mammoth from 'mammoth';

import { PineconeProviderService } from '@/providers';
import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import { PineconeJobType } from '@/queue/pinecone/enums';
import { ThesisDetailResponse } from '@/theses/responses';

@Processor(PINECONE_TOKENS.THESIS)
export class PineconeThesisProcessor extends WorkerHost {
	static readonly NAMESPACE = PINECONE_TOKENS.THESIS + '-namespace';

	private readonly logger = new Logger(PineconeThesisProcessor.name);

	constructor(private readonly pinecone: PineconeProviderService) {
		super();
	}

	async process(job: Job<ThesisDetailResponse | string>): Promise<void> {
		try {
			switch (job.name as PineconeJobType) {
				case PineconeJobType.CREATE_OR_UPDATE: {
					await this.createOrUpdate(job.data as ThesisDetailResponse);
					break;
				}
				case PineconeJobType.DELETE: {
					await this.delete(job.data as string);
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
		// Get the content of the thesis document
		const documentContent = await this.getContentFromDocument(dto);

		const value = {
			englishName: dto.englishName,
			vietnameseName: dto.vietnameseName,
			abbreviation: dto.abbreviation,
			description: dto.description,
			...(dto.domain && { domain: dto.domain }),
			lecturerId: dto.lecturerId,
			semesterId: dto.semesterId,
		};

		const record = {
			_id: dto.id,
			text: JSON.stringify({ ...value, documentContent: documentContent }),
			...value,
		};

		const index = this.pinecone
			.getClient()
			.index(this.pinecone.getIndexName())
			.namespace(PineconeThesisProcessor.NAMESPACE);

		await index.upsertRecords([record]);

		this.logger.log(`Upserting thesis with ID: ${dto.id} into Pinecone.`);
	}

	async delete(id: string): Promise<void> {
		const index = this.pinecone
			.getClient()
			.index(this.pinecone.getIndexName())
			.namespace(PineconeThesisProcessor.NAMESPACE);

		await index.deleteOne(id);

		this.logger.log(`Deleting thesis with ID: ${id} from Pinecone.`);
	}

	// ------------------------------------------------------------------------------------------
	// Additional methods for thesis processing can be added here
	// ------------------------------------------------------------------------------------------

	async getContentFromDocument(dto: ThesisDetailResponse): Promise<string> {
		try {
			if (dto.thesisVersions.length < 1) return '';

			const response = await axios.get(
				dto.thesisVersions[0].supportingDocument,
				{
					responseType: 'arraybuffer',
				},
			);

			const result = await mammoth.extractRawText({ buffer: response.data });

			const content = result.value
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.length > 0)
				.join('\n');

			return content;
		} catch (error) {
			this.logger.error(
				`Failed to get content from document: ${error.message}`,
			);

			return '';
		}
	}
}
