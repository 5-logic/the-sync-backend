import { ResponsibilityResponse } from '@/responsibilities/responses';

import { Responsibility } from '~/generated/prisma';

export const mapResponsibility = (
	responsibility: Responsibility,
): ResponsibilityResponse => ({
	id: responsibility.id,
	name: responsibility.name,
	createdAt: responsibility.createdAt.toISOString(),
	updatedAt: responsibility.updatedAt.toISOString(),
});
