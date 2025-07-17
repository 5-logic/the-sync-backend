import { AdminResponse } from '@/admins/responses';

import { Admin } from '~/generated/prisma';

export const mapAdmin = (admin: Admin): AdminResponse => ({
	id: admin.id,
	username: admin.username,
	email: admin.email ?? '',
	createdAt: admin.createdAt.toISOString(),
	updatedAt: admin.updatedAt.toISOString(),
});
