import { ApiOperationOptions } from '@nestjs/swagger';

export const GroupDocs = {
	create: {
		summary: 'Create group',
		description:
			'Create a new group with required skills and expected responsibilities. Students can only create groups during the PREPARING semester status. Each student can only be a member of one group per semester. The system enforces maximum group limits per semester and automatically generates group codes in the format {SemesterCode}QN{SequenceNumber}. The creator automatically becomes the group leader. Validates that all specified skills and responsibilities exist before group creation.',
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all groups',
		description:
			'Retrieve all groups across all semesters with basic information including group code, name, creation date, and current member count. Results are cached for performance optimization. No authentication required for this public endpoint.',
	} as ApiOperationOptions,

	findMyGroups: {
		summary: 'Get my groups',
		description:
			'Get detailed information about all groups where the authenticated user is currently a member. Returns comprehensive group details including skills, responsibilities, and member information. Automatically filters by the current user session to ensure data privacy.',
	} as ApiOperationOptions,

	findByStudentId: {
		summary: 'Get groups by student ID',
		description:
			'Get detailed information about all groups where a specific student is a member. Returns the same comprehensive group data as the personal endpoint but for any student ID. Useful for administrators, lecturers, or other students to view group memberships across different semesters.',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get group by ID',
		description:
			'Get comprehensive group information including basic details, all members with their roles, required skills, expected responsibilities, and semester information. Results are cached for performance. Returns detailed member profiles and leadership status for complete group overview.',
	} as ApiOperationOptions,

	update: {
		summary: 'Update group',
		description:
			'Update group information including name, project direction, required skills, and expected responsibilities. Only the group leader can perform updates. Only allowed during PREPARING semester status. Validates that all specified skills and responsibilities exist. Updates trigger cache invalidation for related group data.',
	} as ApiOperationOptions,

	changeLeader: {
		summary: 'Change group leader',
		description:
			'Transfer group leadership to another existing member of the group. Only the current group leader can initiate this change. The new leader must already be a member of the group. Only allowed during PREPARING semester status. Sends email notifications to both old and new leaders about the leadership change. Updates all related participation records.',
	} as ApiOperationOptions,

	assignStudent: {
		summary: 'Assign student to group',
		description:
			'Assign a student to an existing group. Restricted to MODERATOR role only for administrative purposes. Validates that the student is not already a member of any group in the same semester. Checks group capacity limits and semester enrollment status. Sends email notification to the assigned student about their group membership.',
	} as ApiOperationOptions,

	removeStudent: {
		summary: 'Remove student from group',
		description:
			'Remove a member from the group. Only the group leader can remove other members. The leader cannot remove themselves - leadership must be transferred first. Only allowed during PREPARING semester status. Automatically handles cleanup of participation records and sends email notification to the removed student.',
	} as ApiOperationOptions,

	leaveGroup: {
		summary: 'Leave group',
		description:
			'Allow a student to leave their current group. Only allowed during the PREPARING semester status. If the student is the group leader, they must transfer leadership to another member before leaving. Cannot leave if the student is the only member of the group - the group must be deleted instead. Sends email notifications to remaining group members about the departure.',
	} as ApiOperationOptions,

	findGroupMembers: {
		summary: 'Get group members',
		description:
			'Get detailed information about all members of a specific group including their personal information, student codes, enrollment status, and leadership roles within the group. Returns comprehensive member profiles with user details and participation status. Results are cached for performance optimization.',
	} as ApiOperationOptions,

	findGroupSkillsAndResponsibilities: {
		summary: 'Get group skills and responsibilities',
		description:
			"Get comprehensive information about the required skills and expected responsibilities associated with a specific group. Returns detailed skill descriptions, categories, and responsibility definitions that define the group's technical and functional requirements. Useful for understanding group capabilities and project scope.",
	} as ApiOperationOptions,

	pickThesis: {
		summary: 'Pick thesis for group',
		description:
			'Allow group leader to pick a thesis for their group during the PICKING semester status. Only the group leader can pick thesis. The thesis must be published (isPublish=true), approved status, and not already assigned to another group. The group must not already have a thesis assigned. Sends email notifications to group members and thesis lecturer about the thesis assignment.',
	} as ApiOperationOptions,

	unpickThesis: {
		summary: 'Unpick thesis from group',
		description:
			'Allow group leader to unpick (remove) the currently assigned thesis from their group during the PICKING semester status. Only the group leader can unpick thesis. The group must have a thesis currently assigned. Sends email notifications to group members and thesis lecturer about the thesis removal.',
	} as ApiOperationOptions,

	delete: {
		summary: 'Delete group',
		description:
			'Delete a group permanently. Only the group leader can delete the group. Groups can only be deleted during the PREPARING semester status. Cannot delete groups that have assigned thesis, submitted work, or any milestone submissions. All pending requests will be automatically rejected. All group members will be notified via email about the group deletion. This action cannot be undone.',
	} as ApiOperationOptions,
};
