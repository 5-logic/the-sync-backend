import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PineconeProviderService, PrismaService } from '@/providers';
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
		private readonly pinecone: PineconeProviderService,
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
			const queryText = this.buildGroupQueryText(group);

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
		if (groupRequiredSkills.length === 0) return 100;

		let matchedSkills = 0;
		let totalWeightedScore = 0;

		for (const requiredSkill of groupRequiredSkills) {
			const studentSkill = studentSkills.find(
				(ss: any) => ss.skill.id === requiredSkill.skill.id,
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
				(sr: any) => sr.responsibility.id === expectedResp.responsibility.id,
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

	/**
	 * Suggest groups for a student based on skills, responsibilities, and interests
	 */
	async suggestGroupsForStudent(studentId: string, topK: number = 10) {
		try {
			this.logger.log(`Suggesting groups for student: ${studentId}`);

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
							status: 'Ongoing',
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

			// Build student query text for vector search
			// const studentQueryText = this.buildStudentQueryText(student);

			// TODO: Implement vector search in GROUP namespace
			// const groupIndex = this.pinecone
			//   .getClient()
			//   .index(this.pinecone.getIndexName())
			//   .namespace(AIStudentService.GROUP_NAMESPACE);
			// Use studentQueryText to find similar groups

			// Get available groups (not full and in same semester)
			const availableGroups = await this.prisma.group.findMany({
				where: {
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

			// TODO: Implement vector search to find similar groups
			// For now, use compatibility scoring algorithm
			const groupSuggestions = availableGroups
				.map((group) => {
					const compatibilityScore = this.calculateStudentGroupCompatibility(
						student,
						group,
					);

					return {
						group: {
							id: group.id,
							code: group.code,
							name: group.name,
							projectDirection: group.projectDirection,
							thesis: group.thesis,
							currentMembersCount: group._count.studentGroupParticipations,
							members: group.studentGroupParticipations.map((sgp) => ({
								id: sgp.student.userId,
								name: sgp.student.user.fullName,
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
}
