import { StudentResponse } from '@/students/responses';

import { Student, User } from '~/generated/prisma';

export const mapStudentV1 = (
	user: User,
	student: Student,
): StudentResponse => ({
	id: user.id,
	fullName: user.fullName,
	email: user.email,
	phoneNumber: user.phoneNumber,
	gender: user.gender.toString(),
	isActive: user.isActive,
	studentCode: student.studentCode,
	majorId: student.majorId,
	createdAt: user.createdAt.toISOString(),
	updatedAt: user.updatedAt.toISOString(),
});

export const mapStudentV2 = (
	student: Student & { user: User },
): StudentResponse => ({
	id: student.user.id,
	fullName: student.user.fullName,
	email: student.user.email,
	phoneNumber: student.user.phoneNumber,
	gender: student.user.gender.toString(),
	isActive: student.user.isActive,
	studentCode: student.studentCode,
	majorId: student.majorId,
	createdAt: student.user.createdAt.toISOString(),
	updatedAt: student.user.updatedAt.toISOString(),
});

export const mapLecturerV3 = (
	user: User & { student: Student | null },
): StudentResponse => {
	if (!user.student) {
		throw new Error('Student not found');
	}

	return {
		id: user.id,
		fullName: user.fullName,
		email: user.email,
		phoneNumber: user.phoneNumber,
		gender: user.gender.toString(),
		isActive: user.isActive,
		studentCode: user.student.studentCode,
		majorId: user.student.majorId,
		createdAt: user.createdAt.toISOString(),
		updatedAt: user.updatedAt.toISOString(),
	};
};
