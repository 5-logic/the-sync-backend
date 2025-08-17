import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
	SuggestGroupsForStudentResponse,
	SuggestStudentsForGroupResponse,
} from '@/ai/responses';
import { GeminiProviderService, PrismaService } from '@/providers';
import { mapStudentDetailResponse } from '@/students/mappers';
import { cleanJsonResponse } from '@/utils';

interface AIResponse {
	reason: string;
	students: Array<{
		id: string;
		compatibility: number;
	}>;
}

interface AIGroupSuggestionResponse {
	reason: string;
	groups: Array<{
		id: string;
		compatibility: number;
	}>;
}

@Injectable()
export class AIStudentService {
	private readonly logger = new Logger(AIStudentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly gemini: GeminiProviderService,
	) {}

	async suggestStudentsForGroup(
		groupId: string,
		semesterId: string,
	): Promise<SuggestStudentsForGroupResponse> {
		this.logger.log(
			`Suggesting students for group ${groupId} in semester ${semesterId}`,
		);

		try {
			// Get group information with current members and their responsibilities
			const group = await this.prisma.group.findUnique({
				where: { id: groupId },
				include: {
					studentGroupParticipations: {
						where: { semesterId },
						include: {
							student: {
								include: {
									user: true,
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

			// Get available students (enrolled in semester but not in any group)
			const availableStudents = await this.prisma.student.findMany({
				where: {
					enrollments: {
						some: {
							semesterId: semesterId,
						},
					},
					studentGroupParticipations: {
						none: {
							semesterId: semesterId,
						},
					},
				},
				include: {
					user: true,
					major: true,
					enrollments: {
						where: { semesterId },
						include: {
							semester: true,
						},
					},
					studentResponsibilities: {
						include: {
							responsibility: true,
						},
					},
				},
			});

			if (availableStudents.length === 0) {
				return {
					reason: 'No available students found for this semester',
					students: [],
				};
			}

			// Format data for AI prompt
			const currentMembers = group.studentGroupParticipations.map(
				(participation) => ({
					id: participation.student.user.id,
					fullName: participation.student.user.fullName,
					studentCode: participation.student.studentCode,
					responsibilities: participation.student.studentResponsibilities.map(
						(sr) => ({
							name: sr.responsibility.name,
							level: sr.level,
						}),
					),
				}),
			);

			const candidateStudents = availableStudents.map((student) => ({
				id: student.user.id,
				fullName: student.user.fullName,
				studentCode: student.studentCode,
				responsibilities: student.studentResponsibilities.map((sr) => ({
					name: sr.responsibility.name,
					level: sr.level,
				})),
			}));

			// Create AI prompt
			const prompt = this.buildPromptForGroupSuggestion(
				currentMembers,
				candidateStudents,
			);

			// Get AI suggestion
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

			let parsedResponse: AIResponse;
			try {
				const cleanedResponse = cleanJsonResponse(responseText);
				parsedResponse = JSON.parse(cleanedResponse);
			} catch (parseError) {
				this.logger.error('Failed to parse AI response:', parseError);
				throw new Error('Invalid AI response format');
			}

			// Get detailed student information for suggested students with compatibility scores
			const suggestedStudentIds = parsedResponse.students.map((s) => s.id);
			const compatibilityMap = new Map(
				parsedResponse.students.map((s) => [s.id, s.compatibility]),
			);

			const studentsWithCompatibility = availableStudents
				.filter((student) => suggestedStudentIds.includes(student.user.id))
				.map((student) => ({
					...mapStudentDetailResponse(student),
					compatibility: compatibilityMap.get(student.user.id) || 0,
				}))
				.sort((a, b) => b.compatibility - a.compatibility);

			return {
				reason: parsedResponse.reason,
				students: studentsWithCompatibility,
			};
		} catch (error) {
			this.logger.error(
				`Error suggesting students for group ${groupId}:`,
				error,
			);
			throw error;
		}
	}

	suggestGroupsForStudent(
		studentId: string,
		semesterId: string,
	): Promise<SuggestGroupsForStudentResponse> {
		return this.suggestGroupsForStudentInternal(studentId, semesterId);
	}

	private async suggestGroupsForStudentInternal(
		studentId: string,
		semesterId: string,
	): Promise<SuggestGroupsForStudentResponse> {
		this.logger.log(
			`Suggesting groups for student ${studentId} in semester ${semesterId}`,
		);

		try {
			// Get student information with responsibilities
			const student = await this.prisma.student.findUnique({
				where: { userId: studentId },
				include: {
					user: true,
					major: true,
					enrollments: {
						where: { semesterId },
						include: {
							semester: true,
						},
					},
					studentResponsibilities: {
						include: {
							responsibility: true,
						},
					},
				},
			});

			if (!student) {
				throw new NotFoundException('Student not found');
			}

			// Check if student is enrolled in the semester
			if (student.enrollments.length === 0) {
				throw new NotFoundException('Student is not enrolled in this semester');
			}

			// Get all groups in the semester with ≤ 4 members (excluding groups with 0 members)
			const groups = await this.prisma.group.findMany({
				where: {
					semesterId: semesterId,
					studentGroupParticipations: {
						some: {
							semesterId: semesterId,
						},
					},
				},
				include: {
					studentGroupParticipations: {
						where: { semesterId },
						include: {
							student: {
								include: {
									user: true,
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

			// Filter groups with 1-4 members
			const eligibleGroups = groups.filter(
				(group) =>
					group.studentGroupParticipations.length >= 1 &&
					group.studentGroupParticipations.length <= 4,
			);

			if (eligibleGroups.length === 0) {
				return {
					reason: 'No suitable groups found in this semester',
					groups: [],
				};
			}

			// Format student data
			const studentData = {
				id: student.user.id,
				fullName: student.user.fullName,
				studentCode: student.studentCode,
				responsibilities: student.studentResponsibilities.map((sr) => ({
					name: sr.responsibility.name,
					level: sr.level,
				})),
			};

			// Format groups data
			const groupsData = eligibleGroups.map((group) => ({
				id: group.id,
				code: group.code,
				name: group.name,
				memberCount: group.studentGroupParticipations.length,
				members: group.studentGroupParticipations.map((participation) => ({
					id: participation.student.user.id,
					fullName: participation.student.user.fullName,
					studentCode: participation.student.studentCode,
					responsibilities: participation.student.studentResponsibilities.map(
						(sr) => ({
							name: sr.responsibility.name,
							level: sr.level,
						}),
					),
				})),
			}));

			// Create AI prompt
			const prompt = this.buildPromptForStudentGroupSuggestion(
				studentData,
				groupsData,
			);

			// Get AI suggestion
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

			let parsedResponse: AIGroupSuggestionResponse;
			try {
				const cleanedResponse = cleanJsonResponse(responseText);
				parsedResponse = JSON.parse(cleanedResponse);
			} catch (parseError) {
				this.logger.error('Failed to parse AI response:', parseError);
				throw new Error('Invalid AI response format');
			}

			// Get detailed group information for suggested groups with compatibility scores
			const suggestedGroupIds = parsedResponse.groups.map((g) => g.id);
			const compatibilityMap = new Map(
				parsedResponse.groups.map((g) => [g.id, g.compatibility]),
			);

			const groupsWithCompatibility = eligibleGroups
				.filter((group) => suggestedGroupIds.includes(group.id))
				.map((group) => {
					// Find the leader of the group
					const leaderParticipation = group.studentGroupParticipations.find(
						(p) => p.isLeader,
					);

					// If no leader found, use the first member as fallback
					const leader =
						leaderParticipation || group.studentGroupParticipations[0];

					return {
						id: group.id,
						code: group.code,
						name: group.name,
						leader: {
							fullName: leader.student.user.fullName,
							studentCode: leader.student.studentCode,
							email: leader.student.user.email,
						},
						memberCount: group.studentGroupParticipations.length,
						compatibility: compatibilityMap.get(group.id) || 0,
					};
				})
				.sort((a, b) => b.compatibility - a.compatibility);

			return {
				reason: parsedResponse.reason,
				groups: groupsWithCompatibility,
			};
		} catch (error) {
			this.logger.error(
				`Error suggesting groups for student ${studentId}:`,
				error,
			);
			throw error;
		}
	}

	private buildPromptForGroupSuggestion(
		currentMembers: Array<{
			id: string;
			fullName: string;
			studentCode: string;
			responsibilities: Array<{ name: string; level: number }>;
		}>,
		candidateStudents: Array<{
			id: string;
			fullName: string;
			studentCode: string;
			responsibilities: Array<{ name: string; level: number }>;
		}>,
	): string {
		return `
You are a team formation expert. Analyze the current group members and suggest the most suitable students to join the group based on responsibility balance and team synergy.

## CONTEXT:
- Each student has 5 responsibilities: Backend, Frontend, DevOps, BA (Business Analyst), and AI
- Each responsibility has a level from 0 to 5 (0 = no experience, 5 = expert level)
- A well-balanced group should have complementary skills and avoid gaps in critical areas

## CURRENT GROUP MEMBERS:
${currentMembers
	.map(
		(member) => `
- ${member.fullName} (${member.studentCode}):
  ${member.responsibilities
		.map((r) => `  - ${r.name}: ${r.level}/5`)
		.join('\n')}`,
	)
	.join('\n')}

## CANDIDATE STUDENTS:
${candidateStudents
	.map(
		(student) => `
- ID: ${student.id}, ${student.fullName} (${student.studentCode}):
  ${student.responsibilities
		.map((r) => `  - ${r.name}: ${r.level}/5`)
		.join('\n')}`,
	)
	.join('\n')}

## EVALUATION CRITERIA:
1. **Skill Gap Analysis**: Identify missing or weak areas in the current group
2. **Complementary Skills**: Prefer candidates who strengthen weak areas
3. **Balanced Distribution**: Avoid overloading one area while neglecting others
4. **Overall Team Synergy**: Consider how well the candidate would fit with existing members

## COMPATIBILITY SCORING (0.0 to 1.0):
- 0.9-1.0: Excellent fit, fills critical gaps perfectly
- 0.7-0.8: Very good fit, strengthens team significantly
- 0.5-0.6: Good fit, provides solid contribution
- 0.3-0.4: Fair fit, some benefits but limitations
- 0.0-0.2: Poor fit, doesn't address team needs

## INSTRUCTIONS:
1. Analyze the current group's strengths and weaknesses
2. Identify what types of skills the group needs most
3. Evaluate each candidate against these needs
4. Select the top 3-5 most suitable candidates
5. Provide compatibility scores and clear reasoning

## OUTPUT FORMAT (JSON only, no explanation):
{
  "reason": "Brief explanation of what the group needs and why these students were selected",
  "students": [
    {
      "id": "student_id",
      "compatibility": 0.85
    }
  ]
}
`;
	}

	private buildPromptForStudentGroupSuggestion(
		studentData: {
			id: string;
			fullName: string;
			studentCode: string;
			responsibilities: Array<{ name: string; level: number }>;
		},
		groupsData: Array<{
			id: string;
			code: string;
			name: string;
			memberCount: number;
			members: Array<{
				id: string;
				fullName: string;
				studentCode: string;
				responsibilities: Array<{ name: string; level: number }>;
			}>;
		}>,
	): string {
		return `
You are a team formation expert. Analyze the student's strengths and suggest the most suitable groups for them to join based on skill complementarity and team needs.

## CONTEXT:
- Each student has 5 responsibilities: Backend, Frontend, DevOps, BA (Business Analyst), and AI
- Each responsibility has a level from 0 to 5 (0 = no experience, 5 = expert level)
- Good team matches occur when the student's strengths complement the group's weaknesses

## STUDENT PROFILE:
${studentData.fullName} (${studentData.studentCode}):
${studentData.responsibilities
	.map((r) => `  - ${r.name}: ${r.level}/5`)
	.join('\n')}

## AVAILABLE GROUPS:
${groupsData
	.map(
		(group) => `
- Group ID: ${group.id}, ${group.name} (${group.code}) - ${group.memberCount} members:
${group.members
	.map(
		(member) => `
  Member: ${member.fullName} (${member.studentCode}):
    ${member.responsibilities
			.map((r) => `    - ${r.name}: ${r.level}/5`)
			.join('\n')}`,
	)
	.join('\n')}`,
	)
	.join('\n')}

## EVALUATION CRITERIA:
1. **Skill Gap Analysis**: Identify what skills each group is missing or weak in
2. **Student's Strengths**: Consider where the student excels (level 3-5)
3. **Complementary Fit**: How well does the student fill the group's gaps?
4. **Team Balance**: Will adding this student create a well-rounded team?
5. **Growth Opportunities**: Consider groups where the student can learn from others

## COMPATIBILITY SCORING (0.0 to 1.0):
- 0.9-1.0: Perfect match, student's strengths exactly fill critical gaps
- 0.7-0.8: Excellent fit, strong contribution with good balance
- 0.5-0.6: Good fit, solid addition to the team
- 0.3-0.4: Fair fit, some benefits but not optimal
- 0.0-0.2: Poor fit, doesn't address team needs effectively

## INSTRUCTIONS:
1. Analyze each group's current skill composition and identify gaps
2. Evaluate how the student's skills would complement each group
3. Consider both filling gaps and maintaining balance
4. Select the top 3-5 most suitable groups
5. Provide compatibility scores and reasoning

## OUTPUT FORMAT (JSON only, no explanation):
{
  "reason": "Brief explanation of the student's key strengths and why these groups were selected",
  "groups": [
    {
      "id": "group_id",
      "compatibility": 0.85
    }
  ]
}
`;
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
