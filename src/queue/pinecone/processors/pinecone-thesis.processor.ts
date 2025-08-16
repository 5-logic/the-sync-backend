import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { Job } from 'bullmq';
import mammoth from 'mammoth';

import { DuplicateThesisResponse } from '@/ai/responses';
import {
	CacheHelperService,
	GeminiProviderService,
	PineconeProviderService,
	PrismaService,
} from '@/providers';
import {
	DUPLICATE_CHECK_CACHE_KEY,
	PINECONE_TOKENS,
} from '@/queue/pinecone/constants';
import { PineconeJobType } from '@/queue/pinecone/enums';
import { ThesisDetailResponse } from '@/theses/responses';
import { cleanJsonResponse } from '@/utils';

import { ThesisStatus } from '~/generated/prisma';

@Processor(PINECONE_TOKENS.THESIS)
export class PineconeThesisProcessor extends WorkerHost {
	static readonly NAMESPACE = PINECONE_TOKENS.THESIS + '-namespace';

	private readonly logger = new Logger(PineconeThesisProcessor.name);

	constructor(
		private readonly gemini: GeminiProviderService,
		private readonly pinecone: PineconeProviderService,
		private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
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
				case PineconeJobType.CHECK_DUPLICATE: {
					await this.checkDuplicate(job.data as string);
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

	async checkDuplicate(thesisId: string): Promise<void> {
		this.logger.log(`Processing duplicate check for thesis ID: ${thesisId}`);

		try {
			// Get the thesis details first
			const thesis = await this.prisma.thesis.findUnique({
				where: { id: thesisId },
			});

			if (!thesis) {
				this.logger.warn(`Thesis with ID ${thesisId} not found`);
				// Save empty result to cache even when thesis not found
				const cacheKey = `${DUPLICATE_CHECK_CACHE_KEY}${thesisId}`;
				await this.cache.saveToCache(cacheKey, [], 0);
				return;
			}

			// Get the Pinecone index
			const index = this.pinecone
				.getClient()
				.index(this.pinecone.getIndexName())
				.namespace(PineconeThesisProcessor.NAMESPACE);

			// First, get the vector of the current thesis
			const fetchResult = await index.fetch([thesisId]);

			if (!fetchResult.records?.[thesisId]) {
				this.logger.warn(
					`Thesis with ID ${thesisId} not found in Pinecone index`,
				);
				// Save empty result to cache when thesis not found in Pinecone
				const cacheKey = `${DUPLICATE_CHECK_CACHE_KEY}${thesisId}`;
				await this.cache.saveToCache(cacheKey, [], 0);
				return;
			}

			const thesisVector = fetchResult.records[thesisId].values;

			if (!thesisVector) {
				this.logger.warn(
					`No vector found for thesis with ID ${thesisId} in Pinecone`,
				);
				// Save empty result to cache when no vector found
				const cacheKey = `${DUPLICATE_CHECK_CACHE_KEY}${thesisId}`;
				await this.cache.saveToCache(cacheKey, [], 0);
				return;
			}

			// First, query with a larger topK to get more potential candidates
			// Only compare with approved theses to ensure quality comparison
			const initialQueryRequest = {
				vector: thesisVector,
				topK: 100, // Get more candidates initially
				includeMetadata: true,
				includeValues: false,
				filter: {
					status: { $eq: ThesisStatus.Approved.toString() },
				},
			};

			const initialQueryResults = await index.query(initialQueryRequest);

			// Process results and filter by similarity threshold (>30%), excluding the original thesis
			const allSimilarCandidates: Array<{
				id: string;
				englishName: string;
				vietnameseName: string;
				description: string;
				vectorSimilarity: number;
			}> = [];

			if (initialQueryResults.matches) {
				for (const match of initialQueryResults.matches) {
					if (match.id !== thesisId && match.metadata) {
						const similarity = match.score || 0;
						// Only include candidates with similarity > 30% (0.3)
						if (similarity > 0.3) {
							allSimilarCandidates.push({
								id: match.id,
								englishName: match.metadata.englishName as string,
								vietnameseName: match.metadata.vietnameseName as string,
								description: match.metadata.description as string,
								vectorSimilarity: similarity,
							});
						}
					}
				}
			}

			// Sort by similarity score (highest first) and take top 5
			const candidates = allSimilarCandidates
				.sort((a, b) => b.vectorSimilarity - a.vectorSimilarity)
				.slice(0, 5);

			this.logger.log(
				`Found ${allSimilarCandidates.length} candidates above 30% similarity, selected top ${candidates.length} for AI analysis`,
			);

			// If no candidates found, save empty array to cache
			if (candidates.length === 0) {
				const cacheKey = `${DUPLICATE_CHECK_CACHE_KEY}${thesisId}`;
				await this.cache.saveToCache(cacheKey, [], 0); // 0 = no expiration
				this.logger.log(
					`No duplicates found for thesis ${thesisId}, saved empty result to cache`,
				);
				return;
			}

			// Use AI to calculate accurate duplicate percentages
			const aiDuplicates = await this.calculateDuplicateWithAI(
				thesis,
				candidates,
			);

			// Sort by duplicate percentage (highest first)
			aiDuplicates.sort(
				(a, b) => b.duplicatePercentage - a.duplicatePercentage,
			);

			// Save to cache with no expiration
			const cacheKey = `${DUPLICATE_CHECK_CACHE_KEY}${thesisId}`;
			await this.cache.saveToCache(cacheKey, aiDuplicates, 0); // 0 = no expiration

			this.logger.log(
				`Found ${aiDuplicates.length} potential duplicates for thesis ${thesisId}, saved to cache`,
			);
		} catch (error) {
			this.logger.error(
				`Failed to check duplicates for thesis ${thesisId}:`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Use AI to calculate accurate duplicate percentages
	 */
	private async calculateDuplicateWithAI(
		originalThesis: any,
		candidates: Array<{
			id: string;
			englishName: string;
			vietnameseName: string;
			description: string;
			vectorSimilarity: number;
		}>,
	): Promise<DuplicateThesisResponse[]> {
		try {
			// Get text content from Pinecone for both original and candidate theses
			const index = this.pinecone
				.getClient()
				.index(this.pinecone.getIndexName())
				.namespace(PineconeThesisProcessor.NAMESPACE);

			// Get original thesis text content
			let originalContent = 'Content not available';
			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const originalFetch = await index.fetch([originalThesis.id]);
				const fetchedContent =
					originalFetch.records?.[originalThesis.id]?.metadata?.text;
				originalContent =
					typeof fetchedContent === 'string'
						? fetchedContent
						: 'Content not available';
			} catch {
				this.logger.warn(
					`Could not fetch content for original thesis ${originalThesis.id}`,
				);
			}

			// Get candidate thesis text contents
			const candidateIds = candidates.map((c) => c.id);
			const candidatesWithContent: Array<{
				id: string;
				englishName: string;
				vietnameseName: string;
				description: string;
				content: string;
			}> = [];

			try {
				const candidatesFetch = await index.fetch(candidateIds);
				for (const candidate of candidates) {
					const fetchedContent =
						candidatesFetch.records?.[candidate.id]?.metadata?.text;
					const content =
						typeof fetchedContent === 'string'
							? fetchedContent
							: 'Content not available';
					candidatesWithContent.push({
						id: candidate.id,
						englishName: candidate.englishName,
						vietnameseName: candidate.vietnameseName,
						description: candidate.description,
						content: content,
					});
				}
			} catch {
				// Fallback to basic information without content
				for (const candidate of candidates) {
					candidatesWithContent.push({
						id: candidate.id,
						englishName: candidate.englishName,
						vietnameseName: candidate.vietnameseName,
						description: candidate.description,
						content: 'Content not available',
					});
				}
			}

			// Prepare original thesis information for AI prompt
			const originalThesisInfo = {
				id: originalThesis.id,
				englishName: originalThesis.englishName || 'Unknown',
				vietnameseName: originalThesis.vietnameseName || 'Unknown',
				description: originalThesis.description || 'No description',
				content: originalContent,
			};

			const prompt = `
You are an AI assistant specialized in detecting thesis duplication and plagiarism. Your task is to analyze the similarity between an original thesis and candidate theses to determine accurate duplication percentages and provide specific reasons.

CRITICAL: Focus ONLY on UNIQUE, SPECIFIC CONTENT. Do NOT count common technology choices or standard architectures as duplication.

## Original Thesis:
- **ID**: ${originalThesisInfo.id}
- **Content**: ${originalThesisInfo.content}

## Candidate Theses to Compare:
${JSON.stringify(
	candidatesWithContent.map((candidate) => ({
		id: candidate.id,
		content: candidate.content,
	})),
	null,
	2,
)}

## STRICTLY IGNORE - These are NOT duplication (common in most theses):
❌ Technology stacks (React, Node.js, MySQL, etc.)
❌ Architecture patterns (RESTful API, MVC, microservices)
❌ General system designs (web app, mobile app, client-server)
❌ Common frameworks and libraries
❌ Standard database designs or API structures
❌ General development methodologies (Agile, Scrum)
❌ Common security measures (authentication, authorization)
❌ Standard testing approaches
❌ General UI/UX patterns
❌ Common deployment strategies
❌ Standard research methods and data collection
❌ General academic writing structure

## ONLY COUNT as duplication - Unique specific content:
✅ Identical business rules or domain logic
✅ Same specific algorithms or mathematical formulas
✅ Identical data processing workflows
✅ Same specific problem-solving approaches for unique challenges
✅ Identical experimental designs for novel scenarios
✅ Same specific feature implementations beyond standard CRUD
✅ Identical unique optimization techniques
✅ Same specific analysis methods for particular domains
✅ Identical novel integration patterns
✅ Same specific custom solutions to unique problems

## Scoring Instructions:
- **duplicatePercentage**: Based ONLY on unique specific content overlap
- **reasons**: Must describe SPECIFIC, UNIQUE similarities (max 3 items, each max 100 characters)
- Be EXTREMELY strict - most theses should score 0-30% unless they have genuine unique content overlap

Guidelines:
- 0-15%: Different unique solutions (only common tech/architecture)
- 16-30%: Some similar domain-specific approaches
- 31-50%: Similar unique business logic or algorithms
- 51-70%: Significant overlap in specific custom solutions
- 71-85%: Major duplication of unique implementations
- 86-100%: Nearly identical unique content and custom solutions

## Output Format:
- Return ONLY a valid JSON array with objects containing exactly these two fields:
[
  {
    "id": "thesis_id",
    "reasons": ["Identical recommendation algorithm logic", "Same fraud detection rules", "Duplicate custom validation workflow"],
    "duplicatePercentage": 65
  }
]
- Return ONLY raw JSON array (no markdown, no code block, no explanations).

## VALID Reason Examples (specific unique content):
✅ "Identical recommendation algorithm using collaborative filtering weights"
✅ "Same custom fraud detection rules for e-commerce transactions"
✅ "Duplicate inventory optimization formula for retail"
✅ "Identical sentiment analysis preprocessing for Vietnamese text"
✅ "Same custom authentication flow for multi-tenant system"

## INVALID Reason Examples (too general - DO NOT USE):
❌ "Similar technology stack (React, Node.js)"
❌ "RESTful API architecture"
❌ "MySQL database design"
❌ "Web application structure"
❌ "Authentication and authorization"
❌ "CRUD operations implementation"
❌ "MVC design pattern"
❌ "Standard login/logout functionality"

## Candidate Metadata:
${candidatesWithContent.map((candidate) => `ID: ${candidate.id} -> English: "${candidate.englishName}", Vietnamese: "${candidate.vietnameseName}", Description: "${candidate.description}"`).join('\n')}

Remember: If two theses only share common technology choices and standard architectures, they should score 0-15% with reasons like ["Different business domains", "Distinct problem approaches", "Unique implementation details"] or simply no reasons if truly different.
			`;

			const ai = this.gemini.getClient();
			const modelName = this.gemini.getModelName();

			const response = await ai.models.generateContent({
				model: modelName,
				contents: prompt,
			});

			const responseText = cleanJsonResponse(response.text?.trim());

			if (!responseText) {
				this.logger.warn('Empty response from AI for duplicate analysis');
				return this.fallbackCalculation(originalThesis, candidates);
			}

			// Parse AI response
			let aiScores: Array<{
				id: string;
				reasons: string[];
				duplicatePercentage: number;
			}>;
			try {
				aiScores = JSON.parse(responseText);
			} catch (parseError) {
				this.logger.error('Failed to parse AI response', parseError);
				return this.fallbackCalculation(originalThesis, candidates);
			}

			// Validate response format
			if (!Array.isArray(aiScores)) {
				this.logger.warn('AI response is not an array');
				return this.fallbackCalculation(originalThesis, candidates);
			}

			// Validate each score object and map to DuplicateThesisResponse
			const result: DuplicateThesisResponse[] = [];
			for (const score of aiScores) {
				if (
					typeof score.id === 'string' &&
					Array.isArray(score.reasons) &&
					typeof score.duplicatePercentage === 'number'
				) {
					const candidate = candidatesWithContent.find(
						(c) => c.id === score.id,
					);
					if (candidate) {
						result.push({
							id: score.id,
							englishName: candidate.englishName,
							vietnameseName: candidate.vietnameseName,
							description: candidate.description,
							reasons: score.reasons,
							duplicatePercentage: score.duplicatePercentage,
						});
					}
				}
			}

			this.logger.log(
				`AI duplicate analysis completed for ${result.length} potential duplicates`,
			);
			return result;
		} catch (error) {
			this.logger.error('Error calculating duplicates with AI:', error);
			return this.fallbackCalculation(originalThesis, candidates);
		}
	}

	/**
	 * Fallback calculation when AI fails
	 */
	private fallbackCalculation(
		originalThesis: any,
		candidates: Array<{
			id: string;
			englishName: string;
			vietnameseName: string;
			description: string;
			vectorSimilarity: number;
		}>,
	): DuplicateThesisResponse[] {
		return candidates
			.map((candidate) => {
				// Simple similarity based on vector score
				const similarity = Math.min(candidate.vectorSimilarity * 100, 100);
				return {
					id: candidate.id,
					englishName: candidate.englishName,
					vietnameseName: candidate.vietnameseName,
					description: candidate.description,
					reasons: ['Vector similarity detected'],
					duplicatePercentage: Math.round(similarity),
				};
			})
			.filter((result) => result.duplicatePercentage > 30)
			.sort((a, b) => b.duplicatePercentage - a.duplicatePercentage);
	}
}
