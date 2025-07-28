import { ApiOperationOptions } from '@nestjs/swagger';

export const GroupModeratorDocs = {
	assignStudent: {
		summary: 'Assign student to group',
		description: `Assign a student to an existing group.\n\n- **Moderator access only**.\n- Validates that the student is not already a member of any group in the same semester.\n- Checks group capacity limits (max 6 members) and semester enrollment status (must be 'Preparing').\n- Checks student is enrolled in the semester and not already in the group.\n- Checks that there are not more than 4 students without a group in the semester.\n- Sends email notification to the assigned student and all group members.\n- Returns error if assignment rules are violated (404/409/502).\n- Logs all assignment attempts and errors.\n\n**Fields:**\n- id: Group ID (path param)\n- studentId: Student ID (body)\n\n**Response includes:**\n- success: true\n- message: Assignment success message\n- group: Updated group info (all members, thesis, semester, etc.)\n- assignedStudent: userId, fullName, email, major, isLeader`,
	} as ApiOperationOptions,
};
