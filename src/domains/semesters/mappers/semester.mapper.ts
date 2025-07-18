import { SemesterResponse } from '@/semesters/responses';

import { Semester } from '~/generated/prisma';

export const mapSemester = (semester: Semester): SemesterResponse => ({
	id: semester.id,
	name: semester.name,
	code: semester.code,
	maxGroup: semester.maxGroup ?? undefined,
	status: semester.status.toString(),
	ongoingPhase: semester.ongoingPhase?.toString() ?? undefined,
	defaultThesesPerLecturer: semester.defaultThesesPerLecturer,
	maxThesesPerLecturer: semester.maxThesesPerLecturer,
	createdAt: semester.createdAt.toISOString(),
	updatedAt: semester.updatedAt.toISOString(),
});
