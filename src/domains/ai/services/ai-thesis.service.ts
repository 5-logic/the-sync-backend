import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
	DuplicateThesisResponse,
	ThesisSuggestionResponse,
} from '@/ai/responses';
import {
	CacheHelperService,
	GeminiProviderService,
	PineconeProviderService,
	PrismaService,
} from '@/providers';
import { PineconeThesisProcessor } from '@/queue';
import { DUPLICATE_CHECK_CACHE_KEY } from '@/queue/pinecone/constants';
import { cleanJsonResponse } from '@/utils';

import { ThesisStatus } from '~/generated/prisma';

@Injectable()
export class AIThesisService {
	private readonly logger = new Logger(AIThesisService.name);

	private static readonly NAMESPACE = PineconeThesisProcessor.NAMESPACE;

	constructor(
		private readonly prisma: PrismaService,
		private readonly pinecone: PineconeProviderService,
		private readonly gemini: GeminiProviderService,
		private readonly cache: CacheHelperService,
	) {}

	async checkDuplicate(thesisId: string): Promise<DuplicateThesisResponse[]> {
		this.logger.log(`Checking for duplicates for thesis ID: ${thesisId}`);

		try {
			// Get the thesis details first
			const thesis = await this.prisma.thesis.findUnique({
				where: { id: thesisId },
			});
			if (!thesis) {
				this.logger.warn(`Thesis with ID ${thesisId} not found`);
				throw new NotFoundException(`Thesis not found`);
			}

			// Try to get results from cache first
			const cacheKey = `${DUPLICATE_CHECK_CACHE_KEY}${thesisId}`;
			const cachedResults =
				await this.cache.getFromCache<DuplicateThesisResponse[]>(cacheKey);

			if (cachedResults) {
				this.logger.log(
					`Returning cached duplicate results for thesis ${thesisId}`,
				);
				return cachedResults;
			}

			// If not in cache, check if thesis status is Pending (should have results soon)
			if (thesis.status === ThesisStatus.Pending) {
				this.logger.warn(
					`Duplicate check results not yet available for thesis ${thesisId} (status: Pending). Background job may still be processing.`,
				);
				return [];
			}

			// If thesis is not Pending and no cache, it means duplicate check was never triggered
			// This can happen for old theses or if the background job failed
			this.logger.warn(
				`No duplicate check results available for thesis ${thesisId} (status: ${thesis.status}). Duplicate check is only performed for theses with Pending status.`,
			);
			return [];
		} catch (error) {
			this.logger.error(
				`Failed to check duplicates for thesis ${thesisId}:`,
				error,
			);
			throw error;
		}
	}

	async suggestThesesForGroup(
		groupId: string,
	): Promise<ThesisSuggestionResponse> {
		this.logger.log(`Suggesting theses for group ID: ${groupId}`);

		try {
			// Get group with all its members and their responsibilities
			const group = await this.prisma.group.findUnique({
				where: { id: groupId },
				include: {
					studentGroupParticipations: {
						include: {
							student: {
								include: {
									user: true,
									major: true,
									studentResponsibilities: {
										include: {
											responsibility: true,
										},
									},
								},
							},
						},
					},
				},
			});

			if (!group) {
				throw new NotFoundException('Group not found');
			}

			// Get available theses that are approved, published, available (no group), and in the same semester
			const availableTheses = await this.prisma.thesis.findMany({
				where: {
					status: ThesisStatus.Approved,
					isPublish: true,
					groupId: null, // Not assigned to any group yet
					semesterId: group.semesterId,
				},
				include: {
					supervisions: {
						include: {
							lecturer: {
								include: {
									user: true,
								},
							},
						},
					},
				},
			});

			if (availableTheses.length === 0) {
				return {
					reason: 'No available theses found in this semester',
					theses: [],
				};
			}

			// Get theses with their vector content from Pinecone
			const thesesWithContent =
				await this.getThesesFromPinecone(availableTheses);

			// Prepare group information for AI
			const groupInfo = {
				id: group.id,
				name: group.name,
				code: group.code,
				projectDirection: group.projectDirection || 'Not specified',
				memberCount: group.studentGroupParticipations.length,
				members: group.studentGroupParticipations.map((participation) => ({
					fullName: participation.student.user.fullName,
					studentCode: participation.student.studentCode,
					major: {
						name: participation.student.major.name,
						code: participation.student.major.code,
					},
					responsibilities: participation.student.studentResponsibilities.map(
						(sr) => ({
							name: sr.responsibility.name,
							level: sr.level,
						}),
					),
				})),
			};

			// Use AI to analyze and suggest theses
			const aiResponse = await this.generateThesisSuggestionsWithAI(
				groupInfo,
				thesesWithContent,
			);

			// Map the response to include thesis details
			const thesesMap = new Map(
				availableTheses.map((thesis) => [thesis.id, thesis]),
			);
			const compatibilityMap = new Map(
				aiResponse.theses.map((t) => [t.id, t.compatibility]),
			);

			const suggestedTheses = aiResponse.theses
				.map((suggestion) => {
					const thesis = thesesMap.get(suggestion.id);
					if (!thesis) return null;

					// Collect all supervisors
					const supervisorsName: string[] = [];

					// Add additional supervisors from supervisions if any
					if (thesis.supervisions) {
						thesis.supervisions.forEach((supervision) => {
							const supervisorName = supervision.lecturer.user.fullName;
							if (!supervisorsName.includes(supervisorName)) {
								supervisorsName.push(supervisorName);
							}
						});
					}

					return {
						id: thesis.id,
						englishName: thesis.englishName,
						abbreviation: thesis.abbreviation,
						supervisorsName: supervisorsName,
						compatibility: compatibilityMap.get(thesis.id) || 0,
						orientation: thesis.orientation,
					};
				})
				.filter((thesis) => thesis !== null)
				.sort((a, b) => b.compatibility - a.compatibility);

			return {
				reason: aiResponse.reason,
				theses: suggestedTheses,
			};
		} catch (error) {
			this.logger.error(
				`Failed to suggest theses for group ${groupId}:`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Get thesis content from Pinecone vector database
	 */
	private async getThesesFromPinecone(theses: any[]): Promise<
		Array<{
			id: string;
			englishName: string;
			vietnameseName: string;
			abbreviation: string;
			description: string;
			orientation: string;
			domain: string;
			content: string;
		}>
	> {
		try {
			const index = this.pinecone
				.getClient()
				.index(this.pinecone.getIndexName())
				.namespace(AIThesisService.NAMESPACE);

			const thesisIds = theses.map((thesis) => thesis.id) as string[];
			const fetchResult = await index.fetch(thesisIds);

			return theses.map((thesis) => {
				const pineconeRecord = fetchResult.records?.[thesis.id];
				const content =
					pineconeRecord?.metadata?.text || thesis.description || '';

				return {
					id: thesis.id,
					englishName: thesis.englishName,
					vietnameseName: thesis.vietnameseName,
					abbreviation: thesis.abbreviation,
					description: thesis.description,
					orientation: thesis.orientation,
					domain: thesis.domain || 'General',
					content: content,
				};
			});
		} catch (error) {
			this.logger.error('Failed to fetch thesis content from Pinecone:', error);
			// Fallback to basic thesis information
			return theses.map((thesis) => ({
				id: thesis.id,
				englishName: thesis.englishName,
				vietnameseName: thesis.vietnameseName,
				abbreviation: thesis.abbreviation,
				description: thesis.description,
				orientation: thesis.orientation,
				domain: thesis.domain || 'General',
				content: thesis.description || '',
			}));
		}
	}

	/**
	 * Use AI to generate thesis suggestions for a group
	 */
	private async generateThesisSuggestionsWithAI(
		groupInfo: any,
		thesesWithContent: any[],
	): Promise<{
		reason: string;
		theses: Array<{ id: string; compatibility: number }>;
	}> {
		try {
			const prompt = `
You are an AI assistant that recommends thesis topics for student groups based on their skills, responsibilities, and academic backgrounds. Your task is to analyze the group's capabilities and suggest the most suitable theses.

## Group Information:
- **Group Name**: ${groupInfo.name}
- **Group Code**: ${groupInfo.code}
- **Project Direction**: ${groupInfo.projectDirection}
- **Member Count**: ${groupInfo.memberCount}
- **Members**: ${groupInfo.members
				.map(
					(member) =>
						`${member.fullName} [${member.studentCode}] - Major: ${member.major.name} (${member.major.code}) - Skills: ${member.responsibilities.map((r) => `${r.name} (Level ${r.level})`).join(', ')}`,
				)
				.join('; ')}

## Available Theses:
${JSON.stringify(thesesWithContent, null, 2)}

## Evaluation Criteria:
1. **Skill Match (35% weight)**: How well do the group members' responsibility skills align with thesis requirements?
2. **Academic Background (25% weight)**: How well does the thesis match the academic majors of group members?
3. **Content Relevance (20% weight)**: How relevant is the thesis content to the group's project direction and interests?
4. **Thesis Orientation (15% weight)**: Consider thesis orientation (AI, SE, Neutral) against group skills and major focus.
5. **Group Capacity (5% weight)**: Is the thesis complexity suitable for the group size and skill levels?

## Responsibility Skill Mapping Guide:
- **Backend**: Server-side development, databases, APIs, system architecture
- **Frontend**: User interfaces, web development, user experience
- **DevOps**: Deployment, infrastructure, CI/CD, system administration
- **BA (Business Analysis)**: Requirements analysis, system design, documentation
- **AI**: Machine learning, data science, artificial intelligence algorithms

## Level Interpretation:
- Level 0-2: Beginner/Basic understanding
- Level 3-5: Intermediate/Working knowledge
- Level 6-8: Advanced/Proficient
- Level 9-10: Expert/Highly skilled

## Scoring Instructions:
- **compatibility**: A float between 0 and 1 representing how well the thesis matches the group
- Consider higher compatibility for:
  * Strong skill alignment between thesis requirements and group capabilities
  * Academic major relevance (SE majors for software projects, AI majors for AI projects)
  * Appropriate complexity for group size and skill levels
  * Clear project direction alignment

## Output Format:
Return ONLY a valid JSON object with exactly these fields:
{
  "reason": "Brief explanation of the analysis and why these theses are recommended for the group",
  "theses": [
    {
      "id": "thesis_id",
      "compatibility": 0.85
    }
  ]
}

## Important Notes:
- Only include theses with compatibility > 0.3
- Sort by compatibility score (highest first)
- Limit to top 10 theses maximum
- Consider that diverse skill sets within a group can handle interdisciplinary projects
- Higher skill levels should result in better compatibility for technically demanding theses
- Do not include any explanation or additional text, only the JSON object
			`;

			const ai = this.gemini.getClient();
			const modelName = this.gemini.getModelLiteName();

			const response = await ai.models.generateContent({
				model: modelName,
				contents: prompt,
			});

			const responseText = response.text?.trim();
			if (!responseText) {
				throw new Error('Empty response from AI');
			}

			// Parse AI response
			let aiResponse: {
				reason: string;
				theses: Array<{ id: string; compatibility: number }>;
			};
			try {
				const cleanedResponse = cleanJsonResponse(responseText);
				aiResponse = JSON.parse(cleanedResponse);
			} catch (parseError) {
				this.logger.error('Failed to parse AI response:', parseError);
				this.logger.error('AI Response:', responseText);
				throw new Error('Invalid JSON response from AI');
			}

			// Validate response format
			if (!aiResponse.reason || !Array.isArray(aiResponse.theses)) {
				throw new Error('AI response format is invalid');
			}

			// Validate and normalize each thesis suggestion
			for (const thesis of aiResponse.theses) {
				if (!thesis.id || typeof thesis.compatibility !== 'number') {
					throw new Error('Invalid thesis suggestion format in AI response');
				}
				// Ensure compatibility is within valid range
				thesis.compatibility = Math.max(0, Math.min(1, thesis.compatibility));
			}

			// Filter by compatibility threshold and sort
			const filteredTheses = aiResponse.theses
				.filter((thesis) => thesis.compatibility > 0.3)
				.sort((a, b) => b.compatibility - a.compatibility)
				.slice(0, 10); // Limit to top 10

			this.logger.log(
				`AI thesis suggestion completed for group ${groupInfo.id}: ${filteredTheses.length} theses suggested`,
			);

			return {
				reason: aiResponse.reason,
				theses: filteredTheses,
			};
		} catch (error) {
			this.logger.error('Error generating thesis suggestions with AI:', error);

			// Fallback to simple recommendation
			return {
				reason:
					'AI analysis temporarily unavailable. Showing available theses based on basic matching.',
				theses: thesesWithContent.slice(0, 5).map((thesis, index) => ({
					id: thesis.id,
					compatibility: 0.6 - index * 0.1, // Decreasing compatibility
				})),
			};
		}
	}

	/**
	 * Calculate relevance score between thesis and group
	 */
	private calculateThesisGroupRelevance(thesis: any, group: any): number {
		let totalScore = 0;
		let factors = 0;

		// Basic text similarity (simplified)
		const thesisText =
			`${thesis.englishName} ${thesis.vietnameseName} ${thesis.description}`.toLowerCase();
		const groupText =
			`${group.name} ${group.projectDirection || ''}`.toLowerCase();

		// Simple keyword matching
		const thesisWords = thesisText.split(/\s+/);
		const groupWords = groupText.split(/\s+/);
		const commonWords = thesisWords.filter(
			(word) => word.length > 3 && groupWords.includes(word),
		);

		if (thesisWords.length > 0) {
			const textSimilarity = (commonWords.length / thesisWords.length) * 100;
			totalScore += textSimilarity * 0.4; // 40% weight for text similarity
			factors += 0.4;
		}

		// Base relevance (always included)
		totalScore += 60 * 0.7; // 70% base score (increased from 30% since skills are removed)
		factors += 0.7;

		return factors > 0 ? Math.round(totalScore / factors) : 60;
	}

	/**
	 * Analyze factors that match between thesis and group
	 */
	private analyzeThesisGroupMatch(thesis: any, group: any): string[] {
		const factors: string[] = [];

		// Check project direction alignment
		if (group.projectDirection && thesis.description) {
			const direction = group.projectDirection.toLowerCase();
			const description = thesis.description.toLowerCase();
			if (description.includes(direction)) {
				factors.push(`Project direction alignment: ${group.projectDirection}`);
			}
		}

		// Check thesis complexity vs group size
		const groupSize = group.studentGroupParticipations?.length || 0;
		if (groupSize > 0) {
			if (groupSize >= 3) {
				factors.push('Group size suitable for complex thesis');
			} else {
				factors.push('Smaller group - suitable for focused thesis');
			}
		}

		return factors;
	}

	async getThesis(
		thesisId: string,
	): Promise<{ id: string; semesterId: string }> {
		const thesis = await this.prisma.thesis.findUnique({
			where: { id: thesisId },
			select: {
				id: true,
				semesterId: true,
			},
		});

		if (!thesis) {
			throw new NotFoundException('Thesis not found');
		}

		return thesis;
	}

	async getGroup(groupId: string): Promise<{ id: string; semesterId: string }> {
		const group = await this.prisma.group.findUnique({
			where: { id: groupId },
			select: {
				id: true,
				semesterId: true,
			},
		});

		if (!group) {
			throw new NotFoundException('Group not found');
		}

		return group;
	}
}
