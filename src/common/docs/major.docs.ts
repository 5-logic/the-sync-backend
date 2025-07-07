import { ApiOperationOptions } from '@nestjs/swagger';

export const MajorDocs = {
	findAll: {
		summary: 'Get all majors',
		description: 'Retrieve all available majors in the system.',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get major by ID',
		description: 'Retrieve specific major information by ID.',
	} as ApiOperationOptions,
};
