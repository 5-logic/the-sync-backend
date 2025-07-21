import { ApiOperationOptions } from '@nestjs/swagger';

export const ChecklistDocs: Record<string, ApiOperationOptions> = {
	create: {
		summary: 'Create a new checklist',
		description: `Create a new checklist with name, description, and optional milestone assignment.\n\n- **Moderator access only** (authentication and MODERATOR role required).\n- If milestoneId is provided, validates that the milestone exists, has not started yet, and does not already have a checklist.\n- Each milestone can have only one checklist.\n- Returns created checklist with milestone info, checklist items, and item/review counts.\n- Returns 409 error if milestone has started or already has a checklist.\n- Returns 404 error if milestone does not exist.\n- Logs all creation attempts and errors.`,
	},

	findAll: {
		summary: 'Get all checklists',
		description: `Retrieve all checklists with their associated milestone information, checklist items, and review/item counts.\n\n- **Lecturer/Moderator access only**.\n- Results are ordered by creation date (newest first).\n- Logs all fetch attempts and errors.`,
	},

	findOne: {
		summary: 'Get a specific checklist by ID',
		description: `Retrieve detailed information about a specific checklist.\n\n- **Lecturer/Moderator access only**.\n- Returns milestone details (with semester info), all checklist items, review history with lecturer and submission details, and item/review counts.\n- Returns 404 error if checklist does not exist.\n- Logs all fetch attempts and errors.`,
	},

	update: {
		summary: 'Update a checklist',
		description: `Update checklist name, description, and milestone assignment.\n\n- **Moderator access only**.\n- If checklist is currently attached to a milestone, validates that milestone has not started.\n- If updating to attach to a new milestone, validates that new milestone exists, has not started, and does not already have a checklist.\n- Each milestone can have only one checklist.\n- Returns updated checklist with milestone info and item/review counts.\n- Returns 409 error if milestone has started or new milestone already has a checklist.\n- Returns 404 error if checklist or milestone does not exist.\n- Logs all update attempts and errors.`,
	},

	remove: {
		summary: 'Delete a checklist',
		description: `Permanently delete a checklist.\n\n- **Moderator access only**.\n- If attached to a milestone, validates that milestone has not started.\n- Cannot delete if the checklist has been used in any reviews.\n- Cascade deletes all associated checklist items.\n- Returns 409 error if milestone has started or checklist has reviews.\n- Returns 404 error if checklist does not exist.\n- Logs all deletion attempts and errors.`,
	},

	findByMilestone: {
		summary: 'Get all checklists for a specific milestone',
		description: `Retrieve all checklists associated with a specific milestone, including their checklist items and counts.\n\n- **Lecturer/Moderator access only**.\n- Validates that the milestone exists.\n- Returns milestone details along with associated checklists ordered by creation date.\n- Returns 404 error if milestone does not exist.\n- Logs all fetch attempts and errors.`,
	},
};
