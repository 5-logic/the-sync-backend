import { ApiOperationOptions } from '@nestjs/swagger';

export const ChecklistDocs: Record<string, ApiOperationOptions> = {
	create: {
		summary: 'Create a new checklist',
		description:
			'Creates a new checklist. If milestoneId is provided, validates that the milestone has not started yet.',
	},
	findAll: {
		summary: 'Get all checklists',
		description:
			'Retrieves all checklists with their associated milestone information and item counts.',
	},
	findOne: {
		summary: 'Get a specific checklist by ID',
		description:
			'Retrieves detailed information about a specific checklist including its items and review history.',
	},
	update: {
		summary: 'Update a checklist',
		description:
			'Updates a checklist. If the checklist is attached to a milestone, validates that the milestone has not started yet.',
	},
	remove: {
		summary: 'Delete a checklist',
		description:
			'Deletes a checklist. If attached to a milestone, validates timing. Cannot delete if used in reviews.',
	},
	findByMilestone: {
		summary: 'Get all checklists for a specific milestone',
		description:
			'Retrieves all checklists associated with a specific milestone.',
	},
};
