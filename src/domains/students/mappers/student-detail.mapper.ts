import { StudentDetailResponse } from '@/students/responses';

import {
	Enrollment,
	Major,
	Responsibility,
	Semester,
	Skill,
	SkillSet,
	Student,
	StudentExpectedResponsibility,
	StudentSkill,
	User,
} from '~/generated/prisma';

type StudentDetailData = Student & {
	user: User;
	major: Major;
	enrollments: (Enrollment & { semester: Semester })[];
	studentSkills: (StudentSkill & { skill: Skill & { skillSet: SkillSet } })[];
	studentExpectedResponsibilities: (StudentExpectedResponsibility & {
		responsibility: Responsibility;
	})[];
};

export const mapStudentDetailResponse = (
	data: StudentDetailData,
): StudentDetailResponse => ({
	id: data.user.id,
	fullName: data.user.fullName,
	email: data.user.email,
	gender: data.user.gender.toString(),
	phoneNumber: data.user.phoneNumber,
	isActive: data.user.isActive,
	studentCode: data.studentCode,
	majorId: data.major.id,
	createdAt: data.user.createdAt.toISOString(),
	updatedAt: data.user.updatedAt.toISOString(),
	major: data.major,
	enrollments: data.enrollments.map((e) => ({
		semester: {
			id: e.semester.id,
			name: e.semester.name,
			code: e.semester.code,
			status: e.semester.status,
		},
		status: e.status,
	})),
	studentSkills: data.studentSkills.map((e) => ({
		skillId: e.skill.id,
		skillName: e.skill.name,
		level: e.level.toString(),
		skillSet: {
			id: e.skill.skillSet.id,
			name: e.skill.skillSet.name,
		},
	})),
	studentExpectedResponsibilities: data.studentExpectedResponsibilities.map(
		(ser) => ({
			responsibilityId: ser.responsibility.id,
			responsibilityName: ser.responsibility.name,
		}),
	),
});
