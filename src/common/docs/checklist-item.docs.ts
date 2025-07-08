import { ApiOperationOptions } from '@nestjs/swagger';

export const ChecklistItemDocs: Record<string, ApiOperationOptions> = {
	createMany: {
		summary: 'Create multiple checklist items',
		description:
			'Create multiple checklist items in a single transaction. Validates that the referenced checklist exists before creating any items. All items are created atomically - if any item fails, the entire operation is rolled back. **Moderator access only.**',
	},

	findAll: {
		summary: 'Get all checklist items',
		description:
			'Retrieve all checklist items across the system or filter by specific checklist ID using query parameter. Returns comprehensive item information including parent checklist details. Results are ordered by creation date (newest first). **Lecturer/Moderator access only.**',
	},

	findOne: {
		summary: 'Get checklist item by ID',
		description:
			'Get detailed information about a specific checklist item including its parent checklist details and associated review items with lecturer feedback. Returns comprehensive data including review history and acceptance status. **Lecturer/Moderator access only.**',
	},

	remove: {
		summary: 'Delete checklist item',
		description:
			'Permanently delete a checklist item from the system. Validates that the item exists before deletion. Warning: This action cannot be undone and will also remove any associated review items. **Moderator access only.**',
	},

	findByChecklistId: {
		summary: 'Get checklist items by checklist ID',
		description:
			'Retrieve all checklist items belonging to a specific checklist. Validates that the parent checklist exists before fetching items. Results are ordered by importance (required items first) and then by creation date. **Lecturer/Moderator access only.**',
	},

	updateMany: {
		summary: 'Update multiple checklist items',
		description:
			'Update multiple checklist items in a single operation. Validates that the checklist exists and all specified items belong to that checklist. Updates are performed in parallel for better performance. **Moderator access only.**',
	},
};
