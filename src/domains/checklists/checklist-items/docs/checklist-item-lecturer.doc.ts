import { ApiOperationOptions } from '@nestjs/swagger';

export const ChecklistItemLecturerDocs = {
	findAll: {
		summary: 'Get all checklist items',
		description: `Retrieve all checklist items across the system, or filter by specific checklist ID using a query parameter.\n\n- **Lecturer/Moderator access only**.\n- Returns comprehensive item information including parent checklist details.\n- Results are ordered by required items first, then by creation date.\n\n**Response includes:**\n- Checklist item ID, name, description, isRequired, createdAt\n- Parent checklist info (id, name, description)`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get checklist item by ID',
		description: `Get detailed information about a specific checklist item.\n\n- **Lecturer/Moderator access only**.\n- Returns parent checklist details and associated review items with lecturer feedback.\n- Returns review history and acceptance status.\n- Returns 404 error if item does not exist.\n\n**Response includes:**\n- Checklist item ID, name, description, isRequired, createdAt\n- Parent checklist info (id, name, description)\n- reviewItems: review ID, feedback, lecturer (user: id, fullName, email)`,
	} as ApiOperationOptions,

	findByChecklistId: {
		summary: 'Get checklist items by checklist ID',
		description: `Retrieve all checklist items belonging to a specific checklist.\n\n- **Lecturer/Moderator access only**.\n- Validates that the parent checklist exists before fetching items.\n- Results are ordered by creation date.\n- Returns 404 error if checklist does not exist.\n\n**Response includes:**\n- Checklist item ID, name, description, isRequired, createdAt\n- Parent checklist info (id, name, description)`,
	} as ApiOperationOptions,
};
