import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { DuplicateThesisResponse } from '@/ai/responses';
import {
	GeminiProviderService,
	PineconeProviderService,
	PrismaService,
} from '@/providers';
import { PineconeThesisProcessor } from '@/queue';

import { ThesisStatus } from '~/generated/prisma';

@Injectable()
export class AIThesisService {
	private readonly logger = new Logger(AIThesisService.name);

	private static readonly NAMESPACE = PineconeThesisProcessor.NAMESPACE;

	constructor(
		private readonly prisma: PrismaService,
		private readonly pinecone: PineconeProviderService,
		private readonly gemini: GeminiProviderService,
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

			// Get the Pinecone index
			const index = this.pinecone
				.getClient()
				.index(this.pinecone.getIndexName())
				.namespace(AIThesisService.NAMESPACE);

			// First, get the vector of the current thesis
			const fetchResult = await index.fetch([thesisId]);

			if (!fetchResult.records?.[thesisId]) {
				throw new NotFoundException(`Thesis not found in vector database`);
			}

			const thesisVector = fetchResult.records[thesisId].values;

			if (!thesisVector) {
				throw new NotFoundException(`Thesis not found in vector database`);
			}

			// Now query using the vector to find similar content
			const queryRequest = {
				vector: thesisVector,
				topK: 50,
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
					if (match.score && match?.score > 0.7) {
						const duplicatePercentage =
							Math.round(match.score * 100 * 100) / 100;

						duplicates.push({
							id: match.id,
							englishName: (match.metadata?.englishName as string) ?? 'Unknown',
							vietnameseName:
								(match.metadata?.vietnameseName as string) ?? 'Unknown',
							description:
								(match.metadata?.description as string) ?? 'No description',
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

			return duplicates;
		} catch (error) {
			this.logger.error(
				`Failed to check duplicates for thesis ${thesisId}:`,
				error,
			);

			throw error;
		}
	}

	/**
	 * Suggest theses for a group based on skills, responsibilities, and group dynamics
	 */
	async suggestThesesForGroup(groupId: string, topK: number = 10) {
		try {
			this.logger.log(`Suggesting theses for group: ${groupId}`);

			// Get group with full information
			const group = await this.prisma.group.findUnique({
				where: { id: groupId },
				include: {
					groupRequiredSkills: {
						include: {
							skill: true,
						},
					},
					groupExpectedResponsibilities: {
						include: {
							responsibility: true,
						},
					},
					studentGroupParticipations: {
						include: {
							student: {
								include: {
									user: {
										select: {
											id: true,
											fullName: true,
										},
									},
									studentSkills: {
										include: {
											skill: true,
										},
									},
									studentExpectedResponsibilities: {
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
				throw new NotFoundException(`Group with ID ${groupId} not found`);
			}

			// Get available theses (not selected by any group)
			const availableTheses = await this.prisma.thesis.findMany({
				where: {
					groupId: null, // No group has selected this thesis
					status: ThesisStatus.Approved, // Only approved theses
					isPublish: true, // Only published theses
					semesterId: group.semesterId, // Same semester as the group
				},
				include: {
					lecturer: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
				},
			});

			// Build group query text for vector search
			// const groupQueryText = this.buildGroupQueryTextForThesis(group);

			// TODO: Implement vector search in THESIS namespace
			// const thesisIndex = this.pinecone
			//   .getClient()
			//   .index(this.pinecone.getIndexName())
			//   .namespace(AIThesisService.NAMESPACE);
			// Use groupQueryText to find similar available theses

			// Use AI to calculate relevance scores and matching factors
			const aiScores = await this.calculateRelevanceWithAI(
				group,
				availableTheses,
			);

			// Map the AI scores back to full thesis information and limit to topK
			const thesisSuggestions = aiScores.slice(0, topK).map((aiScore) => {
				const thesis = availableTheses.find((t) => t.id === aiScore.id);
				if (!thesis) {
					throw new Error(`Thesis with ID ${aiScore.id} not found`);
				}

				return {
					thesis: {
						id: thesis.id,
						englishName: thesis.englishName,
						vietnameseName: thesis.vietnameseName,
						description: thesis.description,
						lecturer: {
							id: thesis.lecturer.user.id,
							name: thesis.lecturer.user.fullName,
							email: thesis.lecturer.user.email,
						},
					},
					relevanceScore: aiScore.relevanceScore,
					matchingFactors: aiScore.matchingFactors,
				};
			});

			return {
				group: {
					id: group.id,
					code: group.code,
					name: group.name,
					projectDirection: group.projectDirection,
					membersCount: group.studentGroupParticipations.length,
				},
				suggestions: thesisSuggestions,
				totalAvailableTheses: availableTheses.length,
			};
		} catch (error) {
			this.logger.error('Error suggesting theses for group', error);
			throw error;
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

		// Skills relevance
		if (group.groupRequiredSkills?.length > 0) {
			const skillsRelevance = this.calculateSkillsRelevanceForThesis(
				thesis,
				group.groupRequiredSkills as any[],
			);
			totalScore += skillsRelevance * 0.3; // 30% weight for skills
			factors += 0.3;
		}

		// Base relevance (always included)
		totalScore += 60 * 0.3; // 30% base score
		factors += 0.3;

		return factors > 0 ? Math.round(totalScore / factors) : 60;
	}

	/**
	 * Calculate skills relevance for thesis
	 */
	private calculateSkillsRelevanceForThesis(
		thesis: any,
		groupSkills: any[],
	): number {
		// This is a simplified approach - in real implementation,
		// we would use more sophisticated NLP/semantic matching
		const thesisText =
			`${thesis.englishName} ${thesis.description}`.toLowerCase();

		let matchingSkills = 0;
		for (const groupSkill of groupSkills) {
			const skillName = String(groupSkill.skill.name).toLowerCase();
			if (thesisText.includes(skillName)) {
				matchingSkills++;
			}
		}

		return groupSkills.length > 0
			? Math.round((matchingSkills / groupSkills.length) * 100)
			: 50;
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

		// Check skill relevance
		if (group.groupRequiredSkills?.length > 0) {
			const relevantSkills = group.groupRequiredSkills.filter((gs: any) => {
				const skillName = String(gs.skill.name).toLowerCase();
				const thesisText =
					`${thesis.englishName} ${thesis.description}`.toLowerCase();
				return thesisText.includes(skillName);
			});

			if (relevantSkills.length > 0) {
				factors.push(
					`Relevant skills: ${relevantSkills.map((rs: any) => rs.skill.name).join(', ')}`,
				);
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
				requiredSkills:
					group.groupRequiredSkills?.map((gs: any) => ({
						name: gs.skill.name,
					})) || [],
				expectedResponsibilities:
					group.groupExpectedResponsibilities?.map((gr: any) => ({
						name: gr.responsibility.name,
					})) || [],
				currentMembers:
					group.studentGroupParticipations?.map((sgp: any) => ({
						name: sgp.student.user.fullName,
						skills:
							sgp.student.studentSkills?.map((ss: any) => ({
								name: ss.skill.name,
								level: ss.level,
							})) || [],
						responsibilities:
							sgp.student.studentExpectedResponsibilities?.map((sr: any) => ({
								name: sr.responsibility.name,
							})) || [],
					})) || [],
			};

			// Get thesis content from Pinecone and prepare thesis information
			const thesesWithContent = await this.getThesesContentFromPinecone(theses);

			const prompt = `
You are an AI assistant that evaluates thesis-group compatibility for academic projects. Your task is to analyze how well each thesis matches with a specific group based on skills, responsibilities, project requirements, and thesis content.

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
									`${m.name} (Skills: ${m.skills.map((s) => `${s.name} (${s.level})`).join(', ') || 'None'}, Responsibilities: ${m.responsibilities.map((r) => r.name).join(', ') || 'None'})`,
							)
							.join('; ')
					: 'No current members'
			}

## Theses to Evaluate:
${JSON.stringify(thesesWithContent, null, 2)}

## Evaluation Criteria:
1. **Content Relevance (40% weight)**: How well does the thesis content align with the group's project direction and interests?
2. **Skill Requirements (25% weight)**: How well do the required skills for the thesis match the group's available skills?
3. **Responsibility Alignment (20% weight)**: How well do the thesis responsibilities align with what group members expect to do?
4. **Group Dynamics (10% weight)**: How suitable is the thesis complexity/scope for the current group size and composition?
5. **Technical Fit (5% weight)**: How well does the thesis technical requirements match the group's capabilities?

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

	/**
	 * Get thesis content from Pinecone vector database
	 */
	private async getThesesContentFromPinecone(theses: any[]): Promise<
		Array<{
			id: string;
			englishName: string;
			vietnameseName: string;
			description: string;
			content: string;
		}>
	> {
		try {
			const index = this.pinecone
				.getClient()
				.index(this.pinecone.getIndexName())
				.namespace(AIThesisService.NAMESPACE);

			// Get thesis IDs
			const thesisIds = theses.map((t) => t.id);

			// Fetch thesis content from Pinecone
			const fetchResult = await index.fetch(thesisIds as string[]);

			// Map theses with their content
			return theses.map((thesis) => {
				const pineconeRecord = fetchResult.records?.[thesis.id];
				// Try to get content from metadata or fallback to description
				const content =
					(pineconeRecord?.metadata?.text as string) ||
					(pineconeRecord?.metadata?.description as string) ||
					thesis.description ||
					'No content available';

				return {
					id: thesis.id,
					englishName: thesis.englishName || 'Unknown',
					vietnameseName: thesis.vietnameseName || 'Unknown',
					description: thesis.description || 'No description',
					content:
						typeof content === 'string' ? content : 'No content available',
				};
			});
		} catch (error) {
			this.logger.error('Error fetching thesis content from Pinecone:', error);

			// Fallback to basic thesis information without content
			return theses.map((thesis) => ({
				id: thesis.id,
				englishName: thesis.englishName || 'Unknown',
				vietnameseName: thesis.vietnameseName || 'Unknown',
				description: thesis.description || 'No description',
				content: 'Content not available',
			}));
		}
	}
}
