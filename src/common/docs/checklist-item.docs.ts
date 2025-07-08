import { ApiOperationOptions } from '@nestjs/swagger';

export const ChecklistItemDocs: Record<string, ApiOperationOptions> = {
	create: {
		summary: 'Create a new checklist item',
		description:
			'Create a new checklist item with specified name, description, acceptance criteria, and required status. The system validates that the parent checklist exists before creating the item. Items can be marked as required or optional, and acceptance criteria can be set to define review requirements. Automatically generates timestamps for creation tracking.',
	},

	createMany: {
		summary: 'Create multiple checklist items',
		description:
			'Create multiple checklist items in a single transaction. Validates that all referenced checklists exist before creating any items. All items are created atomically - if any item fails, the entire operation is rolled back. Useful for bulk importing checklist items or setting up complete evaluation criteria in one operation.',
	},

	findAll: {
		summary: 'Get all checklist items',
		description:
			'Retrieve all checklist items across the system or filter by specific checklist ID. Returns comprehensive item information including parent checklist details. Results are ordered by creation date (newest first) for easy management. Useful for system administrators and lecturers to review all available checklist criteria.',
	},

	findOne: {
		summary: 'Get checklist item by ID',
		description:
			'Get detailed information about a specific checklist item including its parent checklist details and associated review items. Returns comprehensive data including review history with lecturer feedback and acceptance status. Essential for tracking item evaluation progress and understanding review requirements.',
	},

	update: {
		summary: 'Update checklist item',
		description:
			'Update checklist item information including name, description, acceptance criteria, and required status. The system validates that the checklist item exists and optionally validates new checklist assignment if checklistId is being changed. Updates automatically refresh modification timestamps and can affect ongoing reviews.',
	},

	remove: {
		summary: 'Delete checklist item',
		description:
			'Permanently delete a checklist item from the system. The system validates that the item exists before deletion. Warning: This action cannot be undone and will also remove any associated review items. Use with caution as it may affect ongoing evaluation processes and review history.',
	},

	findByChecklistId: {
		summary: 'Get checklist items by checklist ID',
		description:
			'Retrieve all checklist items belonging to a specific checklist, ordered by importance (required items first) and then by creation date. Validates that the parent checklist exists before fetching items. Essential for displaying complete checklist content and ensuring proper evaluation workflow.',
	},
};
