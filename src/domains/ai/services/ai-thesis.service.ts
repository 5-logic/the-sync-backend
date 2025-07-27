import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { DuplicateThesisResponse } from '@/ai/responses';
import { PineconeProviderService, PrismaService } from '@/providers';
import { PineconeThesisProcessor } from '@/queue';

@Injectable()
export class AIThesisService {
	private readonly logger = new Logger(AIThesisService.name);

	private static readonly NAMESPACE = PineconeThesisProcessor.NAMESPACE;

	constructor(
		private readonly prisma: PrismaService,
		private readonly pinecone: PineconeProviderService,
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
					status: 'APPROVED', // Only approved theses
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
			const groupQueryText = this.buildGroupQueryTextForThesis(group);

			// TODO: Implement vector search to find similar theses
			// For now, use basic text matching and scoring
			const thesisSuggestions = availableTheses
				.map((thesis) => {
					const relevanceScore = this.calculateThesisGroupRelevance(
						thesis,
						group,
					);

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
						relevanceScore,
						matchingFactors: this.analyzeThesisGroupMatch(thesis, group),
					};
				})
				.filter((suggestion) => suggestion.relevanceScore > 30) // Only include relevant suggestions
				.sort((a, b) => b.relevanceScore - a.relevanceScore)
				.slice(0, topK);

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
	 * Build query text for group when searching for thesis
	 */
	private buildGroupQueryTextForThesis(group: any): string {
		const parts: string[] = [];

		// Add group basic info
		parts.push(`Group: ${group.name}`);
		if (group.projectDirection) {
			parts.push(`Project Direction: ${group.projectDirection}`);
		}

		// Group required skills
		if (group.groupRequiredSkills?.length > 0) {
			const skillsText = group.groupRequiredSkills
				.map((gs: any) => `- ${gs.skill.name}`)
				.join('\n');
			parts.push(`Group Skills:\n${skillsText}`);
		}

		// Group expected responsibilities
		if (group.groupExpectedResponsibilities?.length > 0) {
			const responsibilitiesText = group.groupExpectedResponsibilities
				.map((gr: any) => `- ${gr.responsibility.name}`)
				.join('\n');
			parts.push(`Group Responsibilities:\n${responsibilitiesText}`);
		}

		// Members skills aggregation
		const allMemberSkills = group.studentGroupParticipations
			.flatMap((sgp: any) => sgp.student.studentSkills || [])
			.map((ss: any) => ss.skill.name);

		if (allMemberSkills.length > 0) {
			const uniqueSkills = [...new Set(allMemberSkills)];
			parts.push(`Members Skills: ${uniqueSkills.join(', ')}`);
		}

		return parts.join('\n\n');
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
				group.groupRequiredSkills,
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
			const skillName = groupSkill.skill.name.toLowerCase();
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
				const skillName = gs.skill.name.toLowerCase();
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
}
