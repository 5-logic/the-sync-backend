import { ApiOperationOptions } from '@nestjs/swagger';

export const ChecklistItemDocs: Record<string, ApiOperationOptions> = {
	createMany: {
		summary: 'Create multiple checklist items',
		description: `Create multiple checklist items in a single transaction.\n\n- **Moderator access only** (authentication and MODERATOR role required).\n- Validates that the referenced checklist exists before creating any items.\n- All items are created atomically: if any item fails, the entire operation is rolled back.\n- Returns the count and details of created items.\n- Returns 404 error if checklist does not exist.\n- Returns 400 error if creation fails.`,
	},

	createManyOptimized: {
		summary: 'Create multiple checklist items (optimized)',
		description: `Create multiple checklist items in a single operation, optimized for performance.\n\n- **Moderator access only**.\n- Validates that the checklist exists.\n- Only returns the count of created items (no item details).\n- Returns 404 error if checklist does not exist.\n- Returns 400 error if creation fails.`,
	},

	findAll: {
		summary: 'Get all checklist items',
		description: `Retrieve all checklist items across the system, or filter by specific checklist ID using a query parameter.\n\n- **Lecturer/Moderator access only**.\n- Returns comprehensive item information including parent checklist details.\n- Results are ordered by creation date (newest first).`,
	},

	findOne: {
		summary: 'Get checklist item by ID',
		description: `Get detailed information about a specific checklist item.\n\n- **Lecturer/Moderator access only**.\n- Returns parent checklist details and associated review items with lecturer feedback.\n- Returns review history and acceptance status.\n- Returns 404 error if item does not exist.`,
	},

	remove: {
		summary: 'Delete checklist item',
		description: `Permanently delete a checklist item from the system.\n\n- **Moderator access only**.\n- Validates that the item exists before deletion.\n- This action cannot be undone and will also remove any associated review items.\n- Returns 404 error if item does not exist.\n- Returns 400 error if deletion fails.`,
	},

	findByChecklistId: {
		summary: 'Get checklist items by checklist ID',
		description: `Retrieve all checklist items belonging to a specific checklist.\n\n- **Lecturer/Moderator access only**.\n- Validates that the parent checklist exists before fetching items.\n- Results are ordered by importance (required items first) and then by creation date.\n- Returns 404 error if checklist does not exist.`,
	},

	updateMany: {
		summary: 'Update multiple checklist items',
		description: `Update multiple checklist items in a single operation.\n\n- **Moderator access only**.\n- Validates that the checklist exists and all specified items belong to that checklist.\n- Updates are performed in parallel for better performance.\n- Returns updated item details.\n- Returns 404 error if checklist or any item does not exist.\n- Returns 400 error if update fails.`,
	},
};
