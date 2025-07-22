import { ApiOperationOptions } from '@nestjs/swagger';

export const MilestonePublicDocs = {
	findAll: {
		summary: 'Get all milestones',
		description:
			'**Authenticated users only.**\\n' +
			'\\n' +
			'- Returns all milestones ordered by creation date (newest first).\\n' +
			'- Returns milestone details including name, date range, and associated semester.\\n' +
			'- No caching is used to ensure real-time data.\\n' +
			'- Logs all fetch attempts and errors.\\n' +
			'- Status codes: 200 (success), 500 (internal error).',
	} as ApiOperationOptions,

	findBySemester: {
		summary: 'Get milestones by semester',
		description:
			'**Authenticated users only.**\\n' +
			'\\n' +
			'- Requires a valid semester ID as a path parameter.\\n' +
			'- Validates that the semester exists; returns 404 if not found.\\n' +
			'- Returns an array of milestones for the specified semester, ordered by start date.\\n' +
			'- If no milestones exist for the semester, returns an empty array.\\n' +
			'- No caching is used to ensure up-to-date schedule information.\\n' +
			'- Logs all fetch attempts, warnings if no milestones found, and errors.\\n' +
			'- Status codes: 200 (success), 404 (semester not found), 500 (internal error).',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get milestone by ID',
		description:
			'**Authenticated users only.**\\n' +
			'\\n' +
			'- Returns milestone data including name, date range, and associated semester.\\n' +
			'- Returns 404 error if milestone does not exist.\\n' +
			'- Logs all fetch attempts and errors.\\n' +
			'- Status codes: 200 (success), 404 (not found), 500 (internal error).',
	} as ApiOperationOptions,
};
