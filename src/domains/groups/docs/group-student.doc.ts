import { ApiOperationOptions } from '@nestjs/swagger';

export const GroupStudentDocs = {
	create: {
		summary: 'Create group',
		description: `Create a new group with required skills and expected responsibilities.\n\n- **Student access only** (authentication and STUDENT role required).\n- Only allowed during PREPARING semester status.\n- Each student can only be a member of one group per semester.\n- Enforces maximum group limits per semester.\n- Group code is auto-generated.\n- The creator automatically becomes the group leader.\n- Validates that all specified skills and responsibilities exist.\n- Returns error if group creation rules are violated.\n- Logs all creation attempts and errors.\n\n**Fields:**\n- name, projectDirection, skillIds, responsibilityIds\n\n**Response includes:**\n- Complete group info: id, code, name, projectDirection, createdAt, updatedAt, semester, skills, responsibilities, members, leader`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update group',
		description: `Update group information including name, project direction, required skills, and expected responsibilities.\n\n- **Student access only (group leader)**.\n- Only the group leader can perform updates.\n- Only allowed during PREPARING semester status.\n- Validates that all specified skills and responsibilities exist.\n- Updates trigger cache invalidation for related group data.\n- Returns error if update rules are violated.\n- Logs all update attempts and errors.\n\n**Fields:**\n- id (path), name, projectDirection, skillIds, responsibilityIds\n\n**Response includes:**\n- Complete group info (same as create)`,
	} as ApiOperationOptions,

	changeLeader: {
		summary: 'Change group leader',
		description: `Transfer group leadership to another existing member of the group.\n\n- **Student access only (current group leader)**.\n- Only the current group leader can initiate this change.\n- The new leader must already be a member of the group.\n- Only allowed during PREPARING semester status.\n- Sends email notifications to both old and new leaders.\n- Returns error if change rules are violated.\n- Logs all change attempts and errors.\n\n**Fields:**\n- id (path), newLeaderId (body)\n\n**Response includes:**\n- Complete group info (same as create)`,
	} as ApiOperationOptions,

	removeStudent: {
		summary: 'Remove student from group',
		description: `Remove a member from the group.\n\n- **Student access only (group leader)**.\n- Only the group leader can remove other members.\n- The leader cannot remove themselves - leadership must be transferred first.\n- Only allowed during PREPARING semester status.\n- Validates group existence, leader permissions, and member eligibility before removal.\n- Checks that the group is in a valid state for member removal (e.g., not the only member, not violating business rules).\n- Sends email notification to the removed student.\n- Returns error if validation or removal rules are violated.\n- Logs all removal attempts and errors.\n\n**Fields:**\n- id (path), studentId (body)\n\n**Response includes:**\n- success, message, group (updated info), removedStudent: userId, fullName, email, major`,
	} as ApiOperationOptions,

	leaveGroup: {
		summary: 'Leave group',
		description: `Allow a student to leave their current group.\n\n- **Student access only**.\n- Only allowed during the PREPARING semester status.\n- If group is assigned to a thesis, they cannot leave the group until the thesis is unassigned.\n- Leaders can leave their groups freely - the system will preserve empty groups for admin management.\n- Groups are never automatically deleted when students leave - they remain as empty groups available for other students to join.\n- Sends email notifications to remaining group members (if any).\n- Returns error if leave rules are violated.\n- Logs all leave attempts and errors.\n\n**Fields:**\n- id (path)\n\n**Response includes:**\n- success, message, groupDeleted (always false), group (updated info or null if empty), leftStudent: userId, fullName, email, major`,
	} as ApiOperationOptions,

	pickThesis: {
		summary: 'Pick thesis for group',
		description: `Allow group leader to pick a thesis for their group during the PICKING semester status.\n\n- **Student access only (group leader)**.\n- Only the group leader can pick thesis.\n- The thesis must be published (isPublish=true), approved, and not already assigned to another group.\n- The group must not already have a thesis assigned.\n- Sends email notifications to group members and thesis lecturer.\n- Returns error if pick rules are violated.\n- Logs all pick attempts and errors.\n\n**Fields:**\n- id (path), thesisId (body)\n\n**Response includes:**\n- success, message, group (updated info), pickedThesis: id, englishName, vietnameseName`,
	} as ApiOperationOptions,

	unpickThesis: {
		summary: 'Unpick thesis from group',
		description: `Allow group leader to unpick (remove) the currently assigned thesis from their group during the PICKING semester status.\n\n- **Student access only (group leader)**.\n- Only the group leader can unpick thesis.\n- The group must have a thesis currently assigned.\n- **Automatic Application Cancellation:** When unpicking a thesis, the system automatically cancels any approved thesis application for that thesis to maintain data consistency.\n- **Bidirectional Cleanup:** Removes both Group.thesisId and Thesis.groupId relationships.\n- Sends email notifications to group members and thesis lecturer.\n- Returns error if unpick rules are violated.\n- Logs all unpick attempts and errors.\n\n**Fields:**\n- id (path)\n\n**Response includes:**\n- success, message, group (updated info), unpickedThesis: id, englishName, vietnameseName`,
	} as ApiOperationOptions,

	delete: {
		summary: 'Delete group',
		description: `Delete a group permanently.\n\n- **Student access only (group leader)**.\n- Only the group leader can delete the group.\n- Only allowed during the PREPARING semester status.\n- Cannot delete groups that have assigned thesis, submitted work, or any milestone submissions.\n- All pending requests will be automatically rejected.\n- All group members will be notified via email.\n- This action cannot be undone.\n- Returns error if delete rules are violated.\n- Logs all delete attempts and errors.\n\n**Fields:**\n- id (path)\n\n**Response includes:**\n- success, message, deletedGroup: id, code, name, members`,
	} as ApiOperationOptions,
};
