import { RequestResponse } from '@/requests/responses';

import { Request } from '~/generated/prisma';

export const mapRequest = (request: Request): RequestResponse => ({
	id: request.id,
	type: request.type.toString(),
	status: request.status.toString(),
	studentId: request.studentId,
	groupId: request.groupId,
	createdAt: request.createdAt.toISOString(),
	updatedAt: request.updatedAt.toISOString(),
});
