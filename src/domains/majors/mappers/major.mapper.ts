import { MajorResponse } from '@/majors/responses';

import { Major } from '~/generated/prisma';

export const mapMajor = (major: Major): MajorResponse => ({
	id: major.id,
	name: major.name,
	code: major.code,
	createdAt: major.createdAt.toISOString(),
	updatedAt: major.updatedAt.toISOString(),
});
