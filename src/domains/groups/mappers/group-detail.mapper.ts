import { GroupDetailResponse } from '@/groups/responses';

import {
	Group,
	GroupExpectedResponsibility,
	GroupRequiredSkill,
	Major,
	Responsibility,
	Semester,
	Skill,
	SkillSet,
	Student,
	StudentGroupParticipation,
	Thesis,
	User,
} from '~/generated/prisma';

type GroupDetailData = Group & {
	semester: Semester;
	thesis: Thesis | null;
	groupRequiredSkills: (GroupRequiredSkill & {
		skill: Skill & { skillSet: SkillSet };
	})[];
	groupExpectedResponsibilities: (GroupExpectedResponsibility & {
		responsibility: Responsibility;
	})[];
	studentGroupParticipations: (StudentGroupParticipation & {
		student: Student & { user: User; major: Major };
	})[];
};

export const mapGroupDetail = (
	group: GroupDetailData,
): GroupDetailResponse => ({
	id: group.id,
	code: group.code,
	name: group.name,
	projectDirection: group.projectDirection ?? undefined,
	semesterId: group.semesterId,
	thesisId: group.thesisId ?? undefined,
	semester: {
		id: group.semester.id,
		name: group.semester.name,
		code: group.semester.code,
		status: group.semester.status.toString(),
	},
	thesis: group.thesisId
		? {
				id: group.thesis?.id,
				englishName: group.thesis?.englishName,
				vietnameseName: group.thesis?.vietnameseName,
				abbreviation: group.thesis?.abbreviation,
				description: group.thesis?.description,
				status: group.thesis?.status.toString(),
				domain: group.thesis?.domain ?? undefined,
			}
		: undefined,
	groupRequiredSkills: group.groupRequiredSkills.map((grs) => ({
		id: grs.skillId,
		name: grs.skill.name,
		skillSet: {
			id: grs.skill.skillSet.id,
			name: grs.skill.skillSet.name,
		},
	})),
	groupExpectedResponsibilities: group.groupExpectedResponsibilities.map(
		(ger) => ({
			id: ger.responsibility.id,
			name: ger.responsibility.name,
		}),
	),
	studentGroupParticipations: group.studentGroupParticipations.map((sgp) => ({
		id: sgp.studentId,
		fullName: sgp.student.user.fullName,
		email: sgp.student.user.email,
		studentCode: sgp.student.studentCode,
		major: {
			id: sgp.student.major.id,
			name: sgp.student.major.name,
			code: sgp.student.major.code,
		},
		isLeader: sgp.isLeader,
	})),
});
