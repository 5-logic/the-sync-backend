import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { GeminiProviderService, PrismaService } from '@/providers';
import { PineconeGroupProcessor, PineconeStudentProcessor } from '@/queue';

@Injectable()
export class AIStudentService {
	private readonly logger = new Logger(AIStudentService.name);

	// Namespace constants for different data types
	private static readonly STUDENT_NAMESPACE =
		PineconeStudentProcessor.NAMESPACE;
	private static readonly GROUP_NAMESPACE = PineconeGroupProcessor.NAMESPACE;

	constructor(
		private readonly prisma: PrismaService,
		private readonly gemini: GeminiProviderService,
	) {}

	/**
	 * Suggest students for a group based on skills, responsibilities, and thesis content
	 */
	async suggestStudentsForGroup(groupId: string, topK: number = 10) {
		try {
			this.logger.log(`Suggesting students for group: ${groupId}`);

			// Get group with basic information
			const group = await this.prisma.group.findUnique({
				where: { id: groupId },
				include: {
					thesis: {
						select: {
							id: true,
							englishName: true,
							vietnameseName: true,
							description: true,
						},
					},
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
											email: true,
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
					semester: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			if (!group) {
				throw new NotFoundException('Group not found');
			}

			// Build query from group information
			// const queryText = this.buildGroupQueryText(group);

			// TODO: Implement vector search using queryText in STUDENT namespace
			// const index = this.pinecone
			//   .getClient()
			//   .index(this.pinecone.getIndexName())
			//   .namespace(AIStudentService.STUDENT_NAMESPACE);
			// Use queryText to find similar students in vector database

			// For now, we'll use a simple approach - fetch some vectors and calculate similarity manually
			// In a full implementation, you would generate embeddings for queryText and use vector search

			// Get current group member IDs to exclude them
			const currentMemberIds =
				group.studentGroupParticipations?.map((p: any) => p.student.userId) ||
				[];

			// Temporary: Get enrolled students not in any group
			const availableStudents = await this.prisma.student.findMany({
				where: {
					enrollments: {
						some: {
							semesterId: group.semester.id,
						},
					},
					studentGroupParticipations: {
						none: {
							semesterId: group.semester.id,
						},
					},
					userId: {
						notIn: currentMemberIds, // Exclude current group members
					},
				},
				include: {
					user: {
						select: {
							id: true,
							fullName: true,
							email: true,
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
				take: topK * 2, // Get more than needed for filtering
			});

			// Use AI to calculate compatibility scores
			const aiScores = await this.calculateCompatibilityWithAI(
				group,
				availableStudents.slice(0, topK),
			);

			// Map the AI scores back to full student information
			const suggestions = aiScores.map((aiScore) => {
				const student = availableStudents.find(
					(s) => s.userId === aiScore.userId,
				);
				if (!student) {
					throw new Error(`Student with ID ${aiScore.userId} not found`);
				}

				return {
					id: student.userId,
					studentCode: student.studentCode,
					fullName: student.user.fullName,
					email: student.user.email,
					skills: student.studentSkills.map((ss: any) => ({
						id: ss.skill.id,
						name: ss.skill.name,
						level: ss.level,
					})),
					responsibilities: student.studentExpectedResponsibilities.map(
						(sr: any) => ({
							id: sr.responsibility.id,
							name: sr.responsibility.name,
						}),
					),
					similarityScore: aiScore.similarityScore,
					matchPercentage: aiScore.matchPercentage,
				};
			});

			this.logger.log(
				`Found ${suggestions.length} student suggestions for group ${groupId}`,
			);

			return suggestions;
		} catch (error) {
			this.logger.error('Error suggesting students for group', error);
			throw error;
		}
	}

	/**
	 * Build comprehensive query text combining group requirements and thesis content
	 */
	private buildGroupQueryText(group: any): string {
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
			parts.push(`Required Skills:\n${skillsText}`);
		}

		// Group expected responsibilities
		if (group.groupExpectedResponsibilities?.length > 0) {
			const responsibilitiesText = group.groupExpectedResponsibilities
				.map((gr: any) => `- ${gr.responsibility.name}`)
				.join('\n');
			parts.push(`Expected Responsibilities:\n${responsibilitiesText}`);
		}

		// Current members' skills and responsibilities
		if (group.studentGroupParticipations?.length > 0) {
			const membersText = group.studentGroupParticipations
				.map((participation: any) => {
					const student = participation.student;
					const skills = student.studentSkills
						.map((ss: any) => `${ss.skill.name} (level ${ss.level})`)
						.join(', ');
					const responsibilities = student.studentExpectedResponsibilities
						.map((sr: any) => sr.responsibility.name)
						.join(', ');
					return `- ${student.user.fullName}: Skills: ${skills || 'No skills'}, Wants: ${responsibilities || 'No preferences'}`;
				})
				.join('\n');
			parts.push(`Current Members:\n${membersText}`);
		}

		// Thesis content if available
		if (group.thesis) {
			const thesisText = `Thesis: "${group.thesis.englishName || group.thesis.vietnameseName}"\nDescription: ${group.thesis.description || 'No description available'}`;
			parts.push(`Current Thesis:\n${thesisText}`);
		}

		return parts.join('\n\n');
	}

	/**
	 * Calculate compatibility score between a student and group
	 */
	private calculateStudentGroupCompatibility(student: any, group: any): number {
		let totalScore = 0;
		let factors = 0;

		// Check skill matching
		if (group.groupRequiredSkills?.length > 0) {
			const skillMatchScore = this.calculateSkillMatch(
				(student.studentSkills as any[]) || [],
				group.groupRequiredSkills as any[],
			);
			totalScore += skillMatchScore * 0.4; // 40% weight for skills
			factors += 0.4;
		}

		// Check responsibility matching
		if (group.groupExpectedResponsibilities?.length > 0) {
			const responsibilityMatchScore = this.calculateResponsibilityMatch(
				(student.studentExpectedResponsibilities as any[]) || [],
				group.groupExpectedResponsibilities as any[],
			);
			totalScore += responsibilityMatchScore * 0.3; // 30% weight for responsibilities
			factors += 0.3;
		}

		// Base compatibility (always included)
		totalScore += 60 * 0.3; // 30% base score for basic enrollment criteria
		factors += 0.3;

		return factors > 0 ? Math.round(totalScore / factors) : 60;
	}

	/**
	 * Calculate how well student skills match group requirements
	 */
	private calculateSkillMatch(
		studentSkills: any[],
		groupRequiredSkills: any[],
	): number {
		if (!groupRequiredSkills || groupRequiredSkills.length === 0) {
			return 100;
		}

		if (!studentSkills || studentSkills.length === 0) {
			return 0;
		}

		let matchedSkills = 0;
		let totalWeightedScore = 0;

		for (const requiredSkill of groupRequiredSkills) {
			const studentSkill = studentSkills.find(
				(ss: any) => ss.skill?.id === requiredSkill.skill?.id,
			);

			if (studentSkill && studentSkill.level) {
				matchedSkills++;
				// Score based on skill level (assuming level 1-5, where each level = 20 points)
				const levelScore = Math.min(studentSkill.level * 20, 100);
				totalWeightedScore += levelScore;
			}
		}

		if (matchedSkills === 0) {
			return 0;
		}

		const matchPercentage = (matchedSkills / groupRequiredSkills.length) * 100;
		const averageSkillScore = totalWeightedScore / matchedSkills;

		// Combine match percentage and skill quality
		const finalScore = Math.round(
			matchPercentage * 0.6 + averageSkillScore * 0.4,
		);

		// Ensure we return a valid number
		return isNaN(finalScore) ? 0 : finalScore;
	}

	/**
	 * Calculate how well student responsibilities align with group expectations
	 */
	private calculateResponsibilityMatch(
		studentResponsibilities: any[],
		groupExpectedResponsibilities: any[],
	): number {
		if (
			!groupExpectedResponsibilities ||
			groupExpectedResponsibilities.length === 0
		) {
			return 100;
		}

		if (!studentResponsibilities || studentResponsibilities.length === 0) {
			return 0;
		}

		let matchedResponsibilities = 0;

		for (const expectedResp of groupExpectedResponsibilities) {
			const studentHasResp = studentResponsibilities.some(
				(sr: any) => sr.responsibility?.id === expectedResp.responsibility?.id,
			);

			if (studentHasResp) {
				matchedResponsibilities++;
			}
		}

		const matchPercentage =
			(matchedResponsibilities / groupExpectedResponsibilities.length) * 100;
		const finalScore = Math.round(matchPercentage);

		// Ensure we return a valid number
		return isNaN(finalScore) ? 0 : finalScore;
	}

	/**
	 * Suggest groups for a student based on skills, responsibilities, and interests
	 */
	async suggestGroupsForStudent(
		studentId: string,
		semesterId: string,
		topK: number = 10,
	) {
		try {
			this.logger.log(
				`Suggesting groups for student: ${studentId} in semester: ${semesterId}`,
			);

			// Get student with full information
			const student = await this.prisma.student.findUnique({
				where: { userId: studentId },
				include: {
					user: {
						select: {
							id: true,
							fullName: true,
							email: true,
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
					enrollments: {
						where: {
							semesterId: semesterId,
						},
						include: {
							semester: true,
						},
					},
				},
			});

			if (!student) {
				throw new NotFoundException(`Student with ID ${studentId} not found`);
			}

			// Check if student is enrolled in the specified semester
			if (!student.enrollments || student.enrollments.length === 0) {
				throw new NotFoundException(
					`Student with ID ${studentId} is not enrolled in semester ${semesterId}`,
				);
			}

			// Build student query text for vector search
			// const studentQueryText = this.buildStudentQueryText(student);

			// TODO: Implement vector search in GROUP namespace
			// const groupIndex = this.pinecone
			//   .getClient()
			//   .index(this.pinecone.getIndexName())
			//   .namespace(AIStudentService.GROUP_NAMESPACE);
			// Use studentQueryText to find similar groups

			// Get available groups (not full and in same semester)
			const allGroups = await this.prisma.group.findMany({
				where: {
					semesterId: semesterId, // Filter by semester
					studentGroupParticipations: {
						none: {
							studentId: student.userId,
						},
					},
				},
				include: {
					thesis: {
						select: {
							id: true,
							englishName: true,
							vietnameseName: true,
							description: true,
						},
					},
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
								},
							},
						},
					},
					_count: {
						select: {
							studentGroupParticipations: true,
						},
					},
				},
			});

			// Filter groups with less than 5 members
			const availableGroups = allGroups.filter(
				(group) => group._count.studentGroupParticipations < 5,
			);

			// TODO: Implement vector search to find similar groups
			// For now, use compatibility scoring algorithm
			const groupSuggestions = availableGroups
				.map((group) => {
					const compatibilityScore = this.calculateStudentGroupCompatibility(
						student,
						group,
					);

					// Find the leader of the group
					const leaderParticipation = group.studentGroupParticipations.find(
						(sgp) => sgp.isLeader,
					);

					return {
						group: {
							id: group.id,
							code: group.code,
							name: group.name,
							projectDirection: group.projectDirection,
							thesis: group.thesis,
							currentMembersCount: group._count.studentGroupParticipations,
							leader: leaderParticipation
								? {
										id: leaderParticipation.student.userId,
										name: leaderParticipation.student.user.fullName,
									}
								: null,
							members: group.studentGroupParticipations.map((sgp) => ({
								id: sgp.student.userId,
								name: sgp.student.user.fullName,
								isLeader: sgp.isLeader,
							})),
						},
						compatibilityScore,
						matchingSkills: this.countMatchingSkills(
							student.studentSkills || [],
							group.groupRequiredSkills || [],
						),
						matchingResponsibilities: this.countMatchingResponsibilities(
							student.studentExpectedResponsibilities || [],
							group.groupExpectedResponsibilities || [],
						),
					};
				})
				.sort((a, b) => b.compatibilityScore - a.compatibilityScore)
				.slice(0, topK);

			return {
				student: {
					id: student.userId,
					studentCode: student.studentCode,
					name: student.user.fullName,
					email: student.user.email,
				},
				suggestions: groupSuggestions,
				totalGroups: availableGroups.length,
			};
		} catch (error) {
			this.logger.error('Error suggesting groups for student', error);
			throw error;
		}
	}

	/**
	 * Build query text for student for vector search
	 */
	private buildStudentQueryText(student: any): string {
		const parts: string[] = [];

		// Add student basic info
		parts.push(`Student: ${student.user.fullName}`);

		// Student skills
		if (student.studentSkills?.length > 0) {
			const skillsText = student.studentSkills
				.map((ss: any) => `- ${ss.skill.name} (Level ${ss.level})`)
				.join('\n');
			parts.push(`Student Skills:\n${skillsText}`);
		}

		// Student expected responsibilities
		if (student.studentExpectedResponsibilities?.length > 0) {
			const responsibilitiesText = student.studentExpectedResponsibilities
				.map((sr: any) => `- ${sr.responsibility.name}`)
				.join('\n');
			parts.push(`Expected Responsibilities:\n${responsibilitiesText}`);
		}

		return parts.join('\n\n');
	}

	/**
	 * Count matching skills between student and group
	 */
	private countMatchingSkills(
		studentSkills: any[],
		groupRequiredSkills: any[],
	): number {
		return groupRequiredSkills.filter((grs) =>
			studentSkills.some((ss) => ss.skill.id === grs.skill.id),
		).length;
	}

	/**
	 * Count matching responsibilities between student and group
	 */
	private countMatchingResponsibilities(
		studentResponsibilities: any[],
		groupResponsibilities: any[],
	): number {
		return groupResponsibilities.filter((gr) =>
			studentResponsibilities.some(
				(sr) => sr.responsibility.id === gr.responsibility.id,
			),
		).length;
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
	 * Use AI to calculate compatibility scores between students and a group
	 */
	private async calculateCompatibilityWithAI(
		group: any,
		students: any[],
	): Promise<
		Array<{
			userId: string;
			similarityScore: number;
			matchPercentage: number;
		}>
	> {
		try {
			// Prepare group information for AI prompt
			const groupInfo = {
				name: group.name,
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
				thesis: group.thesis
					? {
							englishName: group.thesis.englishName,
							vietnameseName: group.thesis.vietnameseName,
							description: group.thesis.description,
						}
					: null,
			};

			// Prepare student information for AI prompt
			const studentsInfo = students.map((student) => ({
				userId: student.userId,
				skills:
					student.studentSkills?.map((ss: any) => ({
						name: ss.skill.name,
						level: ss.level,
					})) || [],
				responsibilities:
					student.studentExpectedResponsibilities?.map((sr: any) => ({
						name: sr.responsibility.name,
					})) || [],
			}));

			const prompt = `
You are an AI assistant that evaluates student-group compatibility for academic projects. Your task is to analyze how well each student matches with a specific group based on skills, responsibilities, and project requirements.

## Group Information:
- **Group Name**: ${groupInfo.name}
- **Project Direction**: ${groupInfo.projectDirection}
- **Required Skills**: ${groupInfo.requiredSkills.map((s) => s.name).join(', ') || 'None specified'}
- **Expected Responsibilities**: ${groupInfo.expectedResponsibilities.map((r) => r.name).join(', ') || 'None specified'}
- **Current Members**: ${
				groupInfo.currentMembers.length > 0
					? groupInfo.currentMembers
							.map(
								(m) =>
									`${m.name} (Skills: ${m.skills.map((s) => `${s.name} Level ${s.level}`).join(', ') || 'None'}, Responsibilities: ${m.responsibilities.map((r) => r.name).join(', ') || 'None'})`,
							)
							.join('; ')
					: 'No current members'
			}
${groupInfo.thesis ? `- **Thesis**: ${groupInfo.thesis.englishName || groupInfo.thesis.vietnameseName} - ${groupInfo.thesis.description}` : '- **Thesis**: Not selected yet'}

## Students to Evaluate:
${JSON.stringify(studentsInfo, null, 2)}

## Evaluation Criteria:
1. **Skill Matching (40% weight)**: How well do the student's skills align with the group's required skills? Consider both skill presence and proficiency levels (1-5 scale).
2. **Responsibility Alignment (30% weight)**: How well do the student's expected responsibilities match the group's expected responsibilities?
3. **Group Dynamics (20% weight)**: How well would this student complement the existing team members' skills and responsibilities?
4. **Project Fit (10% weight)**: How suitable is the student for the thesis/project direction (if available)?

## Scoring Instructions:
- **similarityScore**: A decimal between 0.0 and 1.0 representing overall compatibility
- **matchPercentage**: An integer between 0 and 100 representing the percentage match

## Output Format:
Return ONLY a valid JSON array with objects containing exactly these three fields:
[
  {
    "userId": "student_user_id",
    "similarityScore": 0.85,
    "matchPercentage": 85
  }
]

## Important Notes:
- Consider skill levels: Level 5 = Expert, Level 4 = Advanced, Level 3 = Intermediate, Level 2 = Basic, Level 1 = Beginner
- Higher skill levels should result in better scores for matching required skills
- Students with responsibilities that complement existing members should score higher
- Ensure scores are realistic and well-distributed across the range
- Return results in descending order by matchPercentage
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
				userId: string;
				similarityScore: number;
				matchPercentage: number;
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
					!score.userId ||
					typeof score.similarityScore !== 'number' ||
					typeof score.matchPercentage !== 'number'
				) {
					throw new Error('Invalid score object format from AI');
				}

				// Ensure scores are within valid ranges
				score.similarityScore = Math.max(0, Math.min(1, score.similarityScore));
				score.matchPercentage = Math.max(
					0,
					Math.min(100, Math.round(score.matchPercentage)),
				);
			}

			// Sort by matchPercentage in descending order
			aiScores.sort((a, b) => b.matchPercentage - a.matchPercentage);

			this.logger.log(
				`AI compatibility calculation completed for ${aiScores.length} students`,
			);
			return aiScores;
		} catch (error) {
			this.logger.error('Error calculating compatibility with AI:', error);

			// Fallback to manual calculation if AI fails
			this.logger.warn('Falling back to manual compatibility calculation');
			return students
				.map((student) => {
					const compatibilityScore = this.calculateStudentGroupCompatibility(
						student,
						group,
					);
					return {
						userId: student.userId,
						similarityScore: compatibilityScore / 100,
						matchPercentage: compatibilityScore,
					};
				})
				.sort((a, b) => b.matchPercentage - a.matchPercentage);
		}
	}
}
