import { ApiOperationOptions } from '@nestjs/swagger';

export const GroupLecturerDocs = {
	findSupervisedGroups: {
		summary: 'Get all groups supervised by lecturer in a semester',
		description: `Retrieve all groups in a specific semester where the authenticated lecturer (or moderator) is a supervisor of the group's thesis.\n\n- **Lecturer or Moderator access only** (authentication and LECTURER or MODERATOR role required).\n- Returns all groups in the given semester for which the user is a supervisor (via the Supervision table).\n- Each group includes:\n  - Group details: id, code, name, projectDirection, createdAt, updatedAt\n  - Semester info: id, name, code, startDate, endDate\n  - Thesis info: id, name, lecturer (id, fullName, email, major, user), thesisRequiredSkills (skill: id, name, skillSet), thesisExpectedResponsibilities\n  - All group members: id, user (id, fullName, email), major (id, name), isLeader\n  - Group required skills: skill (id, name, skillSet)\n  - Group expected responsibilities: responsibility (id, name)\n- Useful for lecturers to track/manage all groups they are supervising in a semester.\n- Returns empty array if the lecturer supervises no groups in the semester.\n- Results are always real-time (no cache).\n- Returns 404 if semester does not exist.\n- Logs all fetch attempts and errors.\n\n**Response includes:**\n- Array of group objects with all details above.`,
	} as ApiOperationOptions,
};
