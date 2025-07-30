import { ApiOperationOptions } from '@nestjs/swagger';

export const ChecklistLecturerDocs = {
	findAll: {
		summary: 'Get all checklists',
		description: `Retrieve all checklists with their associated milestone information, checklist items, and review/item counts.\n\n- **Lecturer/Moderator access only**.\n- Results are ordered by creation date (newest first).\n- Logs all fetch attempts and errors.\n\n**Response includes:**\n- Checklist ID, name, description\n- Milestone info (id, name, startDate, endDate)\n- checklistItems\n- item/review counts`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get a specific checklist by ID',
		description: `Retrieve detailed information about a specific checklist.\n\n- **Lecturer/Moderator access only**.\n- Returns milestone details (with semester info), all checklist items, review history with lecturer and submission details, and item/review counts.\n- Returns 404 error if checklist does not exist.\n- Logs all fetch attempts and errors.\n\n**Response includes:**\n- Checklist ID, name, description\n- Milestone info (id, name, startDate, endDate, semester: id, name, code)\n- checklistItems (ordered by createdAt)\n- reviews (lecturer: id, fullName, email; submission: group: id, code, name)\n- item/review counts`,
	} as ApiOperationOptions,

	findByMilestone: {
		summary: 'Get all checklists for a specific milestone',
		description: `Retrieve all checklists associated with a specific milestone, including their checklist items and counts.\n\n- **Lecturer/Moderator access only**.\n- Validates that the milestone exists.\n- Returns milestone details along with associated checklists ordered by creation date.\n- Returns 404 error if milestone does not exist.\n- Logs all fetch attempts and errors.\n\n**Response includes:**\n- Milestone info (id, name, startDate, endDate)\n- checklists: checklist ID, name, description, checklistItems (ordered by createdAt), item/review counts`,
	} as ApiOperationOptions,
};
