import { ApiOperationOptions } from '@nestjs/swagger';

export const ChecklistItemModeratorDocs = {
	createMany: {
		summary: 'Create multiple checklist items',
		description: `Create multiple checklist items in a single transaction.\n\n- **Moderator access only** (authentication and MODERATOR role required).\n- Validates that the referenced checklist exists before creating any items.\n- All items are created atomically: if any item fails, the entire operation is rolled back.\n- Returns the count and details of created items.\n- Returns 404 error if checklist does not exist.\n- Returns 400 error if creation fails.\n\n**Fields:**\n- checklistId: ID of the checklist\n- checklistItems: Array of items to create (name, description, isRequired, etc.)\n\n**Response includes:**\n- count: number of items created\n- createdItems: Array of created item info (id, name, description, isRequired, checklistId)`,
	} as ApiOperationOptions,

	updateMany: {
		summary: 'Update multiple checklist items',
		description: `Update multiple checklist items in a single operation.\n\n- **Moderator access only**.\n- Validates that the checklist exists and all specified items belong to that checklist.\n- Updates are performed in parallel for better performance.\n- Returns updated item details.\n- Returns 404 error if checklist or any item does not exist.\n- Returns 400 error if update fails.\n\n**Fields:**\n- checklistId: ID of the checklist\n- items: Array of items to update (id, name, description, isRequired, etc.)\n\n**Response includes:**\n- updatedItems: Array of updated item info (id, name, description, isRequired, checklistId)`,
	} as ApiOperationOptions,

	remove: {
		summary: 'Delete checklist item',
		description: `Permanently delete a checklist item from the system.\n\n- **Moderator access only**.\n- Validates that the item exists before deletion.\n- This action cannot be undone and will also remove any associated review items.\n- Returns 404 error if item does not exist.\n- Returns 400 error if deletion fails.\n\n**Fields:**\n- id: ID of the checklist item to delete\n\n**Response includes:**\n- Success (empty response)`,
	} as ApiOperationOptions,
};
