import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { DuplicateThesisResponse } from '@/ai/responses';
import {
	CacheHelperService,
	GeminiProviderService,
	PineconeProviderService,
	PrismaService,
} from '@/providers';
import { PineconeThesisProcessor } from '@/queue';
import { DUPLICATE_CHECK_CACHE_KEY } from '@/queue/pinecone/constants';

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

	async suggestThesesForGroup(groupId: string) {}

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

	/**
	 * Use AI to calculate relevance scores between theses and a group
	 */
	private async calculateRelevanceWithAI(
		group: any,
		theses: any[],
	): Promise<
		Array<{
			id: string;
			relevanceScore: number;
			matchingFactors: string[];
		}>
	> {
		try {
			// Prepare group information for AI prompt
			const groupInfo = {
				name: group.name,
				code: group.code,
				projectDirection: group.projectDirection || 'Not specified',
				requiredSkills: [{ name: 'None specified' }], // Skills removed from database
				expectedResponsibilities: [{ name: 'None specified' }], // Responsibilities removed from database
				currentMembers:
					group.studentGroupParticipations?.map((sgp: any) => ({
						name: sgp.student.user.fullName,
						major: sgp.student.major
							? {
									name: sgp.student.major.name,
									code: sgp.student.major.code,
								}
							: null,
						skills: [{ name: 'None', level: 'N/A' }], // Skills removed from database
						responsibilities: [{ name: 'None' }], // Responsibilities removed from database
					})) || [],
			};

			// Prepare thesis information without content from Pinecone
			const thesesWithContent = theses.map((thesis) => ({
				id: thesis.id,
				englishName: thesis.englishName || 'Unknown',
				vietnameseName: thesis.vietnameseName || 'Unknown',
				description: thesis.description || 'No description',
				content: 'Content not available - using basic thesis information',
			}));

			const prompt = `
You are an AI assistant that evaluates thesis-group compatibility for academic projects. Your task is to analyze how well each thesis matches with a specific group based on skills, responsibilities, academic backgrounds (majors), project requirements, and thesis content.

## Group Information:
- **Group Name**: ${groupInfo.name}
- **Group Code**: ${groupInfo.code}
- **Project Direction**: ${groupInfo.projectDirection}
- **Required Skills**: ${groupInfo.requiredSkills.map((s) => s.name).join(', ') || 'None specified'}
- **Expected Responsibilities**: ${groupInfo.expectedResponsibilities.map((r) => r.name).join(', ') || 'None specified'}
- **Current Members**: ${
				groupInfo.currentMembers.length > 0
					? groupInfo.currentMembers
							.map(
								(m) =>
									`${m.name} [Major: ${m.major?.name || 'Unknown'}] (Skills: ${m.skills.map((s) => `${s.name} (${s.level})`).join(', ') || 'None'}, Responsibilities: ${m.responsibilities.map((r) => r.name).join(', ') || 'None'})`,
							)
							.join('; ')
					: 'No current members'
			}

## Theses to Evaluate:
${JSON.stringify(thesesWithContent, null, 2)}

## Evaluation Criteria:
1. **Content Relevance (30% weight)**: How well does the thesis content align with the group's project direction and interests?
2. **Major Compatibility (25% weight)**: How well does the thesis align with the academic majors of the group members? Consider if the thesis requirements match their academic backgrounds.
3. **Skill Requirements (25% weight)**: How well do the required skills for the thesis match the group's available skills?
4. **Responsibility Alignment (15% weight)**: How well do the thesis responsibilities align with what group members expect to do?
5. **Group Dynamics (5% weight)**: How suitable is the thesis complexity/scope for the current group size and composition?

## Scoring Instructions:
- **relevanceScore**: An integer between 0 and 100 representing overall relevance
- **matchingFactors**: An array of strings describing specific reasons why this thesis matches the group

## Output Format:
Return ONLY a valid JSON array with objects containing exactly these three fields:
[
  {
    "id": "thesis_id",
    "relevanceScore": 85,
    "matchingFactors": [
      "Strong alignment with group's required skills in React and Node.js",
      "Thesis complexity suitable for 3-member group",
      "Project direction matches group's web development focus"
    ]
  }
]

## Important Notes:
- Consider the thesis document content (if available) for better matching
- Higher skill levels (Expert > Advanced > Proficient > Intermediate > Beginner) should result in better scores for matching technical requirements
- Consider if the thesis topic and requirements align with the academic majors of group members
- Some interdisciplinary projects may benefit from diverse majors while others require specific academic backgrounds
- Group size should influence complexity suitability
- Ensure scores are realistic and well-distributed across the range
- Return results in descending order by relevanceScore
- Only include theses with relevanceScore > 30
- Do not include any explanation or additional text, only the JSON array
			`;

			const ai = this.gemini.getClient();
			const modelName = this.gemini.getModelName();

			const response = await ai.models.generateContent({
				model: modelName,
				contents: prompt,
			});

			const responseText = response.text?.trim();
			if (!responseText) {
				throw new Error('Empty response from AI');
			}

			// Parse AI response
			let aiScores: Array<{
				id: string;
				relevanceScore: number;
				matchingFactors: string[];
			}>;
			try {
				// Remove potential markdown code blocks
				const cleanedResponse = responseText
					.replace(/```json\n?|\n?```/g, '')
					.trim();
				aiScores = JSON.parse(cleanedResponse);
			} catch (parseError) {
				this.logger.error('Failed to parse AI response:', parseError);
				this.logger.error('AI Response:', responseText);
				throw new Error('Invalid JSON response from AI');
			}

			// Validate response format
			if (!Array.isArray(aiScores)) {
				throw new Error('AI response is not an array');
			}

			// Validate each score object
			for (const score of aiScores) {
				if (
					!score.id ||
					typeof score.relevanceScore !== 'number' ||
					!Array.isArray(score.matchingFactors)
				) {
					throw new Error('Invalid score object format from AI');
				}

				// Ensure scores are within valid ranges
				score.relevanceScore = Math.max(
					0,
					Math.min(100, Math.round(score.relevanceScore)),
				);
			}

			// Sort by relevanceScore in descending order and filter > 30
			const filteredScores = aiScores
				.filter((score) => score.relevanceScore > 30)
				.sort((a, b) => b.relevanceScore - a.relevanceScore);

			this.logger.log(
				`AI relevance calculation completed for ${filteredScores.length} theses`,
			);
			return filteredScores;
		} catch (error) {
			this.logger.error('Error calculating relevance with AI:', error);

			// Fallback to manual calculation if AI fails
			this.logger.warn('Falling back to manual relevance calculation');
			return theses
				.map((thesis) => {
					const relevanceScore = this.calculateThesisGroupRelevance(
						thesis,
						group,
					);
					return {
						id: thesis.id,
						relevanceScore,
						matchingFactors: this.analyzeThesisGroupMatch(thesis, group),
					};
				})
				.filter((score) => score.relevanceScore > 30)
				.sort((a, b) => b.relevanceScore - a.relevanceScore);
		}
	}
}
