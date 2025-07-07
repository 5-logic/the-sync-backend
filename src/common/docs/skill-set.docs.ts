import { ApiOperationOptions } from '@nestjs/swagger';

export const SkillSetDocs = {
	findAll: {
		summary: 'Get all skill sets',
		description:
			'Retrieve all skill sets available in the system with their associated skills. Each skill set contains a categorized collection of related technical skills. Results include skill details sorted alphabetically for easy navigation.',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get skill set by ID',
		description:
			'Retrieve detailed information about a specific skill set including all associated skills. Returns comprehensive skill set data with skill details sorted alphabetically.',
	} as ApiOperationOptions,
};
