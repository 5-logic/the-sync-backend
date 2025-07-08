import { ApiOperationOptions } from '@nestjs/swagger';

export const ChecklistDocs: Record<string, ApiOperationOptions> = {
	create: {
		summary: 'Create a new checklist',
		description:
			'Creates a new checklist with name and description. If milestoneId is provided, validates that the milestone has not started yet. Returns created checklist with milestone info and item counts. **Moderator access only.**',
	},
	findAll: {
		summary: 'Get all checklists',
		description:
			'Retrieves all checklists with their associated milestone information, checklist items, and review/item counts. Results are ordered by creation date (newest first). **Lecturer/Moderator access only.**',
	},
	findOne: {
		summary: 'Get a specific checklist by ID',
		description:
			'Retrieves detailed information about a specific checklist including milestone details (with semester info), all checklist items, review history with lecturer and submission details, and item/review counts. **Lecturer/Moderator access only.**',
	},
	update: {
		summary: 'Update a checklist',
		description:
			'Updates checklist name, description, and milestone assignment. If checklist is currently attached to a milestone, validates that milestone has not started. If updating to attach to a new milestone, validates that new milestone has not started either. **Moderator access only.**',
	},
	remove: {
		summary: 'Delete a checklist',
		description:
			'Permanently deletes a checklist. If attached to a milestone, validates that milestone has not started. Cannot delete if the checklist has been used in any reviews. Cascade deletes all associated checklist items. **Moderator access only.**',
	},
	findByMilestone: {
		summary: 'Get all checklists for a specific milestone',
		description:
			'Retrieves all checklists associated with a specific milestone, including their checklist items and counts. Validates that the milestone exists. Returns milestone details along with associated checklists ordered by creation date. **Lecturer/Moderator access only.**',
	},
};
