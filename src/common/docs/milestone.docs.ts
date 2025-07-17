import { ApiOperationOptions } from '@nestjs/swagger';

export const MilestoneDocs = {
	create: {
		summary: 'Create milestone',
		description: `Create a new milestone for a semester.\n\n- **Admin access only** (authentication and ADMIN role required).\n- Only allowed when the semester status is Ongoing.\n- Validates that the semester exists and is in Ongoing status.\n- Validates date range: start date cannot be in the past, start date must be before end date.\n- Prevents overlapping milestones within the same semester.\n- Automatically creates submission records for all groups in the semester.\n- Returns error if validation fails or milestone overlaps.\n- Logs all creation attempts and errors.`,
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all milestones',
		description: `Retrieve all milestones in the system ordered by creation date (newest first).\n\n- **Authenticated users only**.\n- Returns milestone details including name, date range, and associated semester.\n- Results are not cached to ensure real-time data.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findBySemester: {
		summary: 'Get milestones by semester',
		description: `Retrieve all milestones for a specific semester, ordered by start date.\n\n- **Authenticated users only**.\n- Requires a valid semester ID as a path parameter.\n- Validates that the semester exists; returns 404 if not found.\n- Returns an array of milestones belonging to the specified semester, each with name, date range, and related info.\n- If no milestones exist for the semester, returns an empty array.\n- No caching is used to ensure up-to-date schedule information.\n- Logs all fetch attempts, warnings if no milestones found, and errors.\n- Typical error responses: 404 (semester not found), 500 (internal error).`,
	} as ApiOperationOptions,
	findOne: {
		summary: 'Get milestone by ID',
		description: `Retrieve detailed information about a specific milestone by its unique identifier.\n\n- **Authenticated users only**.\n- Returns milestone data including name, date range, and associated semester.\n- Uses cache-aside pattern for performance (short TTL).\n- Returns 404 error if milestone does not exist.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update milestone',
		description: `Update milestone information including name and date range.\n\n- **Admin access only**.\n- Only allowed before the milestone start date and when the semester status is Ongoing.\n- Validates date range and prevents overlaps with other milestones.\n- Returns error if update rules are violated.\n- Logs all update attempts and errors.`,
	} as ApiOperationOptions,

	delete: {
		summary: 'Delete milestone',
		description: `Permanently delete a milestone.\n\n- **Admin access only**.\n- Only allowed before the milestone start date and when the semester status is Ongoing.\n- Removes all associated submissions.\n- Returns error if delete rules are violated.\n- Logs all deletion attempts and errors.`,
	} as ApiOperationOptions,
};
