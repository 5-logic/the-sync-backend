import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { SuggestStudentsForGroupResponse } from '@/ai/responses';
import { GeminiProviderService, PrismaService } from '@/providers';
import { mapStudentDetailResponse } from '@/students/mappers';
import { cleanJsonResponse } from '@/utils';

interface AIResponse {
	reasons: string;
	students: Array<{
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
					reasons: 'No available students found for this semester',
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

			// Get detailed student information for suggested students
			const suggestedStudentIds = parsedResponse.students.map((s) => s.id);
			const detailedStudents = availableStudents
				.filter((student) => suggestedStudentIds.includes(student.user.id))
				.map((student) => mapStudentDetailResponse(student));

			// Sort students by compatibility score from AI response
			const compatibilityMap = new Map(
				parsedResponse.students.map((s) => [s.id, s.compatibility]),
			);

			detailedStudents.sort((a, b) => {
				const compatibilityA = compatibilityMap.get(a.id) || 0;
				const compatibilityB = compatibilityMap.get(b.id) || 0;
				return compatibilityB - compatibilityA;
			});

			return {
				reasons: parsedResponse.reasons,
				students: detailedStudents,
			};
		} catch (error) {
			this.logger.error(
				`Error suggesting students for group ${groupId}:`,
				error,
			);
			throw error;
		}
	}

	suggestGroupsForStudent(studentId: string, semesterId: string) {
		// TODO: Implement suggest groups for student
		this.logger.log(
			`Suggesting groups for student ${studentId} in semester ${semesterId}`,
		);
		return [];
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
  "reasons": "Brief explanation of what the group needs and why these students were selected",
  "students": [
    {
      "id": "student_id",
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
