import { ApiOperationOptions } from '@nestjs/swagger';

export const ChecklistModeratorDocs = {
	create: {
		summary: 'Create a new checklist',
		description: `Create a new checklist with name, description, and optional milestone assignment.\n\n- **Moderator only** (requires authentication and MODERATOR role).\n- If \`milestoneId\` is provided, validates that the milestone exists, has not started yet, and does not already have a checklist.\n- Each milestone can have only one checklist.\n- Returns created checklist with milestone info, checklist items, and item/review counts.\n- Returns 409 error if milestone has started or already has a checklist.\n- Returns 404 error if milestone does not exist.\n- Logs all creation attempts and errors.\n\n**Fields:**\n- \`name\`: Checklist name (required)\n- \`description\`: Checklist description (optional)\n- \`milestoneId\`: Milestone to attach (optional, must not have started, only one checklist per milestone)\n\n**Response includes:**\n- Checklist ID, name, description, milestone info (id, name, startDate, endDate), checklistItems, item/review counts`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update a checklist',
		description: `Update checklist name, description, and milestone assignment.\n\n- **Moderator only**.\n- If checklist is currently attached to a milestone, validates that milestone has not started.\n- If updating to attach to a new milestone, validates that new milestone exists, has not started, and does not already have a checklist.\n- Each milestone can have only one checklist.\n- Returns updated checklist with milestone info and item/review counts.\n- Returns 409 error if milestone has started or new milestone already has a checklist.\n- Returns 404 error if checklist or milestone does not exist.\n- Logs all update attempts and errors.\n\n**Fields:**\n- \`name\`: New checklist name (optional)\n- \`description\`: New description (optional)\n- \`milestoneId\`: Attach to new milestone (optional, must not have started, only one checklist per milestone)\n\n**Response includes:**\n- Checklist ID, name, description, milestone info (id, name, startDate, endDate), checklistItems, item/review counts`,
	} as ApiOperationOptions,

	remove: {
		summary: 'Delete a checklist',
		description: `Permanently delete a checklist.\n\n- **Moderator only**.\n- If attached to a milestone, validates that milestone has not started.\n- Cannot delete if the checklist has been used in any reviews.\n- Cascade deletes all associated checklist items.\n- Returns 409 error if milestone has started or checklist has reviews.\n- Returns 404 error if checklist does not exist.\n- Logs all deletion attempts and errors.\n\n**Response includes:**\n- Success message\n- Deleted checklist info: ID, name, itemCount`,
	} as ApiOperationOptions,
};
