import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PineconeProviderService, PrismaService } from '@/providers';
import { PineconeStudentProcessor } from '@/queue';

@Injectable()
export class AIStudentService {
	private readonly logger = new Logger(AIStudentService.name);

	private static readonly NAMESPACE = PineconeStudentProcessor.NAMESPACE;

	constructor(
		private readonly prisma: PrismaService,
		private readonly pinecone: PineconeProviderService,
	) {}

	/**
	 * Suggest students for a group based on skills, responsibilities, and thesis content
	 */
	async suggestStudentsForGroup(groupId: string, topK: number = 5) {
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

			// Get Pinecone index for students
			const index = this.pinecone
				.getClient()
				.index(this.pinecone.getIndexName())
				.namespace(AIStudentService.NAMESPACE);

			// Build query from group information
			const queryText = this.buildGroupQueryText(group);

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

			// Calculate compatibility scores based on skills and responsibilities matching
			const suggestions = availableStudents.slice(0, topK).map((student) => {
				const compatibilityScore = this.calculateStudentGroupCompatibility(
					student,
					group,
				);
				return {
					student,
					similarityScore: compatibilityScore / 100, // Convert to 0-1 scale
					matchPercentage: compatibilityScore,
				};
			});

			// Sort by compatibility score (highest first)
			suggestions.sort((a, b) => b.matchPercentage - a.matchPercentage);

			this.logger.log(
				`Found ${suggestions.length} student suggestions for group ${groupId}`,
			);

			return {
				group: {
					id: group.id,
					code: group.code,
					name: group.name,
					thesis: group.thesis,
				},
				suggestions,
				queryContext: queryText,
			};
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
				student.studentSkills || [],
				group.groupRequiredSkills,
			);
			totalScore += skillMatchScore * 0.4; // 40% weight for skills
			factors += 0.4;
		}

		// Check responsibility matching
		if (group.groupExpectedResponsibilities?.length > 0) {
			const responsibilityMatchScore = this.calculateResponsibilityMatch(
				student.studentExpectedResponsibilities || [],
				group.groupExpectedResponsibilities,
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
		if (groupRequiredSkills.length === 0) return 100;

		let matchedSkills = 0;
		let totalWeightedScore = 0;

		for (const requiredSkill of groupRequiredSkills) {
			const studentSkill = studentSkills.find(
				(ss) => ss.skill.id === requiredSkill.skill.id,
			);

			if (studentSkill) {
				matchedSkills++;
				// Score based on skill level (assuming level 1-5, where 3+ is good)
				const levelScore = Math.min(studentSkill.level * 20, 100);
				totalWeightedScore += levelScore;
			}
		}

		if (matchedSkills === 0) return 0;

		const matchPercentage = (matchedSkills / groupRequiredSkills.length) * 100;
		const averageSkillScore = totalWeightedScore / matchedSkills;

		// Combine match percentage and skill quality
		return Math.round(matchPercentage * 0.6 + averageSkillScore * 0.4);
	}

	/**
	 * Calculate how well student responsibilities align with group expectations
	 */
	private calculateResponsibilityMatch(
		studentResponsibilities: any[],
		groupExpectedResponsibilities: any[],
	): number {
		if (groupExpectedResponsibilities.length === 0) return 100;

		let matchedResponsibilities = 0;

		for (const expectedResp of groupExpectedResponsibilities) {
			const studentHasResp = studentResponsibilities.some(
				(sr) => sr.responsibility.id === expectedResp.responsibility.id,
			);

			if (studentHasResp) {
				matchedResponsibilities++;
			}
		}

		return Math.round(
			(matchedResponsibilities / groupExpectedResponsibilities.length) * 100,
		);
	}

	/**
	 * Get basic compatibility analysis between student and group
	 */
	async getStudentGroupCompatibility(studentId: string, groupId: string) {
		try {
			const [student, group] = await Promise.all([
				this.prisma.student.findUnique({
					where: { userId: studentId },
					include: {
						user: {
							select: {
								id: true,
								fullName: true,
								email: true,
							},
						},
					},
				}),
				this.prisma.group.findUnique({
					where: { id: groupId },
					include: {
						thesis: {
							select: {
								englishName: true,
								vietnameseName: true,
								description: true,
							},
						},
					},
				}),
			]);

			if (!student || !group) {
				throw new NotFoundException('Student or group not found');
			}

			return {
				student: {
					id: student.userId,
					name: student.user.fullName,
					email: student.user.email,
				},
				group: {
					id: group.id,
					code: group.code,
					name: group.name,
					thesis: group.thesis,
				},
				compatibilityScore: 75, // Placeholder
				recommendation: 'Good match based on basic criteria',
			};
		} catch (error) {
			this.logger.error('Error analyzing student-group compatibility', error);
			throw error;
		}
	}
}
