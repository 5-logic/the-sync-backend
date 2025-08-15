import { ThesisResponse } from '@/theses/responses';

import { Thesis } from '~/generated/prisma';

export const mapThesis = (thesis: Thesis): ThesisResponse => ({
	id: thesis.id,
	englishName: thesis.englishName,
	vietnameseName: thesis.vietnameseName,
	abbreviation: thesis.abbreviation,
	description: thesis.description,
	domain: thesis.domain ?? undefined,
	orientation: thesis.orientation.toString(),
	status: thesis.status.toString(),
	isPublish: thesis.isPublish,
	groupId: thesis.groupId ?? undefined,
	lecturerId: thesis.lecturerId,
	semesterId: thesis.semesterId,
	createdAt: thesis.createdAt.toISOString(),
	updatedAt: thesis.updatedAt.toISOString(),
});
