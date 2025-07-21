import { ApiOperationOptions } from '@nestjs/swagger';

export const GroupPublicDocs = {
	findAll: {
		summary: 'Get all groups',
		description: `Retrieve all groups across all semesters with basic information including group code, name, creation date, and current member count.\n\n- **No authentication required (public endpoint)**.\n- Results are not cached to ensure real-time data.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findByStudentId: {
		summary: 'Get groups by student ID',
		description: `Get detailed information about all groups where a specific student is a member.\n\n- **Authenticated users only**.\n- Returns the same comprehensive group data as the personal endpoint but for any student ID.\n- Useful for administrators, lecturers, or other students to view group memberships across different semesters.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get group by ID',
		description: `Get comprehensive group information including basic details, all members with their roles, required skills, expected responsibilities, and semester information.\n\n- **Authenticated users only**.\n- Results are cached for performance.\n- Returns detailed member profiles and leadership status.\n- Returns 404 error if group does not exist.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findGroupMembers: {
		summary: 'Get group members',
		description: `Get detailed information about all members of a specific group including their personal information, student codes, enrollment status, and leadership roles.\n\n- **Authenticated users only**.\n- Returns comprehensive member profiles with user details and participation status.\n- Results are cached for performance.\n- Returns 404 error if group does not exist.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findGroupSkillsAndResponsibilities: {
		summary: 'Get group skills and responsibilities',
		description: `Get comprehensive information about the required skills and expected responsibilities associated with a specific group.\n\n- **Authenticated users only**.\n- Returns detailed skill descriptions, categories, and responsibility definitions.\n- Useful for understanding group capabilities and project scope.\n- Returns 404 error if group does not exist.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,
};
