import { ApiOperationOptions } from '@nestjs/swagger';

export const MilestoneDocs = {
	create: {
		summary: 'Create milestone',
		description:
			'Create a new milestone for thesis tracking within a semester. Only available during ongoing semesters. Validates date ranges, prevents overlapping milestones, and ensures start date is not in the past. Milestones help track thesis progress throughout the semester.',
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all milestones',
		description:
			'Retrieve all milestones in the system across all semesters. Returns a comprehensive list of thesis tracking milestones with their details including name, date ranges, and associated semester information. Results are ordered by creation date (newest first).',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get milestone by ID',
		description:
			'Retrieve detailed information about a specific milestone by its unique identifier. Returns complete milestone data including name, start/end dates, creation timestamps, and associated semester. Useful for viewing milestone details or preparing for updates.',
	} as ApiOperationOptions,

	update: {
		summary: 'Update milestone',
		description:
			'Update existing milestone information including name and date ranges. Only allowed for ongoing semesters and before the milestone start date. Validates new date ranges, prevents overlapping with other milestones, and ensures business rules are maintained. Cannot modify milestones that have already started.',
	} as ApiOperationOptions,

	delete: {
		summary: 'Delete milestone',
		description:
			'Permanently delete a milestone from the system. Only allowed for ongoing semesters and before the milestone start date. Ensures the milestone is not in use by any thesis tracking activities. Cannot delete milestones that have already started or are linked to thesis progress.',
	} as ApiOperationOptions,
};
