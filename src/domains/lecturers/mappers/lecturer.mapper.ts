import { LecturerResponse } from '@/lecturers/responses';

import { Lecturer, User } from '~/generated/prisma';

export const mapLecturerV1 = (
	user: User,
	lecturer: Lecturer,
): LecturerResponse => ({
	id: user.id,
	fullName: user.fullName,
	email: user.email,
	phoneNumber: user.phoneNumber,
	gender: user.gender.toString(),
	isActive: user.isActive,
	isModerator: lecturer.isModerator,
	createdAt: user.createdAt.toISOString(),
	updatedAt: user.updatedAt.toISOString(),
});

export const mapLecturerV2 = (
	lecturer: Lecturer & { user: User },
): LecturerResponse => ({
	id: lecturer.user.id,
	fullName: lecturer.user.fullName,
	email: lecturer.user.email,
	phoneNumber: lecturer.user.phoneNumber,
	gender: lecturer.user.gender.toString(),
	isActive: lecturer.user.isActive,
	isModerator: lecturer.isModerator,
	createdAt: lecturer.user.createdAt.toISOString(),
	updatedAt: lecturer.user.updatedAt.toISOString(),
});

export const mapLecturerV3 = (
	user: User & { lecturer: Lecturer | null },
): LecturerResponse => ({
	id: user.id,
	fullName: user.fullName,
	email: user.email,
	phoneNumber: user.phoneNumber,
	gender: user.gender.toString(),
	isActive: user.isActive,
	isModerator: user.lecturer?.isModerator ?? false,
	createdAt: user.createdAt.toISOString(),
	updatedAt: user.updatedAt.toISOString(),
});
