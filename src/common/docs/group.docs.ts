import { ApiOperationOptions } from '@nestjs/swagger';

export const GroupDocs = {
	create: {
		summary: 'Create group',
		description: `Create a new group with required skills and expected responsibilities.\n\n- **Student access only** (authentication and STUDENT role required).\n- Only allowed during PREPARING semester status.\n- Each student can only be a member of one group per semester.\n- Enforces maximum group limits per semester.\n- Group code is auto-generated.\n- The creator automatically becomes the group leader.\n- Validates that all specified skills and responsibilities exist.\n- Returns error if group creation rules are violated.\n- Logs all creation attempts and errors.`,
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all groups',
		description: `Retrieve all groups across all semesters with basic information including group code, name, creation date, and current member count.\n\n- **No authentication required (public endpoint)**.\n- Results are not cached to ensure real-time data.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findMyGroups: {
		summary: 'Get my groups',
		description: `Get detailed information about all groups where the authenticated user is currently a member.\n\n- **Authenticated users only**.\n- Returns comprehensive group details including skills, responsibilities, and member information.\n- Filters by the current user session.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findByStudentId: {
		summary: 'Get groups by student ID',
		description: `Get detailed information about all groups where a specific student is a member.\n\n- **Authenticated users only**.\n- Returns the same comprehensive group data as the personal endpoint but for any student ID.\n- Useful for administrators, lecturers, or other students to view group memberships across different semesters.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get group by ID',
		description: `Get comprehensive group information including basic details, all members with their roles, required skills, expected responsibilities, and semester information.\n\n- **Authenticated users only**.\n- Results are cached for performance.\n- Returns detailed member profiles and leadership status.\n- Returns 404 error if group does not exist.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update group',
		description: `Update group information including name, project direction, required skills, and expected responsibilities.\n\n- **Student access only (group leader)**.\n- Only the group leader can perform updates.\n- Only allowed during PREPARING semester status.\n- Validates that all specified skills and responsibilities exist.\n- Updates trigger cache invalidation for related group data.\n- Returns error if update rules are violated.\n- Logs all update attempts and errors.`,
	} as ApiOperationOptions,

	changeLeader: {
		summary: 'Change group leader',
		description: `Transfer group leadership to another existing member of the group.\n\n- **Student access only (current group leader)**.\n- Only the current group leader can initiate this change.\n- The new leader must already be a member of the group.\n- Only allowed during PREPARING semester status.\n- Sends email notifications to both old and new leaders.\n- Returns error if change rules are violated.\n- Logs all change attempts and errors.`,
	} as ApiOperationOptions,

	assignStudent: {
		summary: 'Assign student to group',
		description: `Assign a student to an existing group.\n\n- **Moderator access only**.\n- Validates that the student is not already a member of any group in the same semester.\n- Checks group capacity limits and semester enrollment status.\n- Sends email notification to the assigned student.\n- Returns error if assignment rules are violated.\n- Logs all assignment attempts and errors.`,
	} as ApiOperationOptions,

	removeStudent: {
		summary: 'Remove student from group',
		description: `Remove a member from the group.\n\n- **Student access only (group leader)**.\n- Only the group leader can remove other members.\n- The leader cannot remove themselves - leadership must be transferred first.\n- Only allowed during PREPARING semester status.\n- Sends email notification to the removed student.\n- Returns error if removal rules are violated.\n- Logs all removal attempts and errors.`,
	} as ApiOperationOptions,

	leaveGroup: {
		summary: 'Leave group',
		description: `Allow a student to leave their current group.\n\n- **Student access only**.\n- Only allowed during the PREPARING semester status.\n- If the student is the group leader, they must transfer leadership to another member before leaving.\n- Cannot leave if the student is the only member of the group - the group must be deleted instead.\n- Sends email notifications to remaining group members.\n- Returns error if leave rules are violated.\n- Logs all leave attempts and errors.`,
	} as ApiOperationOptions,

	findGroupMembers: {
		summary: 'Get group members',
		description: `Get detailed information about all members of a specific group including their personal information, student codes, enrollment status, and leadership roles.\n\n- **Authenticated users only**.\n- Returns comprehensive member profiles with user details and participation status.\n- Results are cached for performance.\n- Returns 404 error if group does not exist.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findGroupSkillsAndResponsibilities: {
		summary: 'Get group skills and responsibilities',
		description: `Get comprehensive information about the required skills and expected responsibilities associated with a specific group.\n\n- **Authenticated users only**.\n- Returns detailed skill descriptions, categories, and responsibility definitions.\n- Useful for understanding group capabilities and project scope.\n- Returns 404 error if group does not exist.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	pickThesis: {
		summary: 'Pick thesis for group',
		description: `Allow group leader to pick a thesis for their group during the PICKING semester status.\n\n- **Student access only (group leader)**.\n- Only the group leader can pick thesis.\n- The thesis must be published (isPublish=true), approved, and not already assigned to another group.\n- The group must not already have a thesis assigned.\n- Sends email notifications to group members and thesis lecturer.\n- Returns error if pick rules are violated.\n- Logs all pick attempts and errors.`,
	} as ApiOperationOptions,

	unpickThesis: {
		summary: 'Unpick thesis from group',
		description: `Allow group leader to unpick (remove) the currently assigned thesis from their group during the PICKING semester status.\n\n- **Student access only (group leader)**.\n- Only the group leader can unpick thesis.\n- The group must have a thesis currently assigned.\n- Sends email notifications to group members and thesis lecturer.\n- Returns error if unpick rules are violated.\n- Logs all unpick attempts and errors.`,
	} as ApiOperationOptions,

	delete: {
		summary: 'Delete group',
		description: `Delete a group permanently.\n\n- **Student access only (group leader)**.\n- Only the group leader can delete the group.\n- Only allowed during the PREPARING semester status.\n- Cannot delete groups that have assigned thesis, submitted work, or any milestone submissions.\n- All pending requests will be automatically rejected.\n- All group members will be notified via email.\n- This action cannot be undone.\n- Returns error if delete rules are violated.\n- Logs all delete attempts and errors.`,
	} as ApiOperationOptions,
};
