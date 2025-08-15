import { StudentDetailResponse } from '@/students/responses';

import {
	Enrollment,
	Major,
	Responsibility,
	Semester,
	Student,
	StudentResponsibility,
	User,
} from '~/generated/prisma';

type StudentDetailData = Student & {
	user: User;
	major: Major;
	enrollments: (Enrollment & { semester: Semester })[];
	studentResponsibilities: (StudentResponsibility & {
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
	studentResponsibilities: data.studentResponsibilities.map((sr) => ({
		responsibilityId: sr.responsibility.id,
		responsibilityName: sr.responsibility.name,
		level: sr.level.toString(),
	})),
});
