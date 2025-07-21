import { DuplicateThesisResponse } from '../responses';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';

import { PineconeConfig, pineconeConfig } from '@/configs';
import { PineconeProviderService, PrismaService } from '@/providers';
import { PineconeThesisProcessor } from '@/queue';
import { ThesisPublishService } from '@/theses/services';

@Injectable()
export class AIThesisService {
	private readonly logger = new Logger(AIThesisService.name);

	private static readonly NAMESPACE = PineconeThesisProcessor.NAMESPACE;

	constructor(
		private readonly prisma: PrismaService,
		private readonly pinecone: PineconeProviderService,
	) {}

	async checkDuplicates(thesisId: string): Promise<DuplicateThesisResponse[]> {
		try {
			// Get the thesis details first
			const thesis = await this.thesisPublishService.findOne(thesisId);
			if (!thesis) {
				throw new NotFoundException(`Thesis with ID ${thesisId} not found`);
			}

			// Get the Pinecone index
			const index = this.pineconeClient
				.Index(this.pineconeConfiguration.indexName)
				.namespace(AIThesisService.NAMESPACE);

			// First, get the vector of the current thesis
			const fetchResult = await index.fetch([thesisId]);

			if (!fetchResult.records || !fetchResult.records[thesisId]) {
				throw new NotFoundException(
					`Thesis ${thesisId} not found in vector database`,
				);
			}

			const thesisVector = fetchResult.records[thesisId].values;

			if (!thesisVector) {
				throw new Error(`No vector data found for thesis ${thesisId}`);
			}

			// Now query using the vector to find similar content
			const queryRequest = {
				vector: thesisVector, // Use the actual vector for semantic search
				topK: 50, // Get top 50 similar records
				includeMetadata: true,
				includeValues: false,
			};

			const queryResults = await index.query(queryRequest);

			// Process results and calculate duplicate percentages
			const duplicates: DuplicateThesisResponse[] = [];

			if (queryResults.matches) {
				for (const match of queryResults.matches) {
					// Skip the thesis itself
					if (match.id === thesisId) {
						continue;
					}

					// Consider as duplicate if similarity score > 0.7 (70%)
					if (match.score && match.score > 0.7) {
						const duplicatePercentage =
							Math.round(match.score * 100 * 100) / 100;

						duplicates.push({
							id: match.id,
							englishName: (match.metadata?.englishName as string) || 'Unknown',
							vietnameseName:
								(match.metadata?.vietnameseName as string) || 'Unknown',
							duplicatePercentage,
						});
					}
				}
			}

			// Sort by duplicate percentage (highest first)
			duplicates.sort((a, b) => b.duplicatePercentage - a.duplicatePercentage);

			this.logger.log(
				`Found ${duplicates.length} potential duplicates for thesis ${thesisId}`,
			);

			return {
				duplicates,
			};
		} catch (error) {
			this.logger.error(
				`Failed to check duplicates for thesis ${thesisId}:`,
				error,
			);

			throw error;
		}
	}
}
