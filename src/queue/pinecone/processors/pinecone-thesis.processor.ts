import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { Job } from 'bullmq';
import mammoth from 'mammoth';

import { GeminiProviderService, PineconeProviderService } from '@/providers';
import { PINECONE_TOKENS } from '@/queue/pinecone/constants';
import { PineconeJobType } from '@/queue/pinecone/enums';
import { ThesisDetailResponse } from '@/theses/responses';

@Processor(PINECONE_TOKENS.THESIS)
export class PineconeThesisProcessor extends WorkerHost {
	static readonly NAMESPACE = PINECONE_TOKENS.THESIS + '-namespace';

	private readonly logger = new Logger(PineconeThesisProcessor.name);

	constructor(
		private readonly gemini: GeminiProviderService,
		private readonly pinecone: PineconeProviderService,
	) {
		super();
	}

	async process(
		job: Job<
			| ThesisDetailResponse
			| string
			| { id: string; metadata: Record<string, any> }
		>,
	): Promise<void> {
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
				case PineconeJobType.UPDATE_METADATA: {
					const metadataData = job.data as {
						id: string;
						metadata: Record<string, any>;
					};
					await this.updateMetadata(metadataData.id, metadataData.metadata);
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
		const formattedContent =
			documentContent === ''
				? ''
				: await this.formatDocumentContent(documentContent);

		const value = {
			englishName: dto.englishName,
			vietnameseName: dto.vietnameseName,
			abbreviation: dto.abbreviation,
			description: dto.description,
			domain: dto.domain ?? 'null',
			status: dto.status.toString(),
			isPublish: dto.isPublish,
			groupId: dto.groupId ?? 'null',
			lecturerId: dto.lecturerId,
			semesterId: dto.semesterId,
		};

		const record = {
			_id: dto.id,
			text: formattedContent,
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

	async updateMetadata(
		id: string,
		metadata: Record<string, any>,
	): Promise<void> {
		const index = this.pinecone
			.getClient()
			.index(this.pinecone.getIndexName())
			.namespace(PineconeThesisProcessor.NAMESPACE);

		try {
			// Update only the metadata using Pinecone's update method
			await index.update({
				id: id,
				metadata: metadata,
			});

			this.logger.log(
				`Updated metadata for thesis with ID: ${id} in Pinecone.`,
			);
		} catch (error) {
			this.logger.error(
				`Failed to update metadata for thesis with ID: ${id}`,
				error,
			);
		}
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
			this.logger.error('Failed to get content from document:', error);

			return '';
		}
	}

	async formatDocumentContent(content: string): Promise<string> {
		try {
			const ai = this.gemini.getClient();
			const modelName = this.gemini.getModelName();

			const prompt = `
			You are given the raw content of a document, which may contain headers, footers, templates, placeholder sections, or formatting noise.

			Your task is:
			- Remove non-essential parts such as document titles, headers, footers, templates, or formatting noise.
			- DO NOT rephrase, rewrite, summarize, or modify the original content. Keep sentence structure and wording exactly as-is.
			- Only clean the content by trimming useless sections.
			- Preserve paragraph breaks (line breaks).
			- For any bullet lists (regardless of level), **normalize all bullets to use a dash "-"** only.
			- Do not use any other bullet symbols like "*", "•", "●", "■", or "▪".
			- Output the result in plain text without any special markdown or formatting.
			
			Here is the input content:
			${content}
			`;

			const response = await ai.models.generateContent({
				model: modelName,
				contents: prompt,
			});

			return response.text ?? content;
		} catch (error) {
			this.logger.error('Failed to format document content:', error);

			return content;
		}
	}
}
