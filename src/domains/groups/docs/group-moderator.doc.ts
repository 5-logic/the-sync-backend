import { ApiOperationOptions } from '@nestjs/swagger';

export const GroupModeratorDocs = {
	assignStudent: {
		summary: 'Assign student to group',
		description: `Assign a student to an existing group.\n\n- **Moderator access only**.\n- Validates that the student is not already a member of any group in the same semester.\n- Checks group capacity limits and semester enrollment status.\n- Sends email notification to the assigned student.\n- Returns error if assignment rules are violated.\n- Logs all assignment attempts and errors.`,
	} as ApiOperationOptions,
};
