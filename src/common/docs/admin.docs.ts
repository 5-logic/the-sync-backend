import { ApiOperationOptions } from '@nestjs/swagger';

export const AdminDocs = {
	findOne: {
		summary: 'Get admin by ID',
		description: 'Retrieve admin details by ID. Admin access only.',
	} as ApiOperationOptions,

	update: {
		summary: 'Update admin profile',
		description: 'Update current admin email and password.',
	} as ApiOperationOptions,
};
