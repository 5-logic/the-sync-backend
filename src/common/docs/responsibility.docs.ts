import { ApiOperationOptions } from '@nestjs/swagger';

export const ResponsibilityDocs = {
	findAll: {
		summary: 'Get all responsibilities',
		description:
			'Retrieve all responsibility definitions available in the system. Responsibilities define the expected roles and duties that group members should fulfill during project work.',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get responsibility by ID',
		description:
			'Retrieve detailed information about a specific responsibility by its unique identifier. Returns comprehensive responsibility definition including name and description.',
	} as ApiOperationOptions,
};
