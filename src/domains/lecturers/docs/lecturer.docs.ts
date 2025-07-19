import { ApiOperationOptions } from '@nestjs/swagger';

export const LecturerDocs = {
	findAll: {
		summary: 'Get all lecturers',
		description: `Retrieve a comprehensive list of all lecturers in the system with their profile information including name, email, contact details, and moderator status.\n\n- **Authenticated users only**.\n- Results are not cached to ensure real-time data.\n- Ordered by creation date (newest first).\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get lecturer by ID',
		description: `Retrieve detailed profile information for a specific lecturer by their unique user ID.\n\n- **Authenticated users only**.\n- Returns complete lecturer data including personal information, contact details, academic status, and moderator privileges.\n- Uses cache-aside pattern for performance.\n- Returns 404 error if lecturer does not exist.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update lecturer profile',
		description: `Allow lecturers to update their own profile information including full name, contact details, and personal preferences.\n\n- **Lecturer/Moderator access only**.\n- Lecturers can only modify their own profiles and cannot change their email address or role permissions.\n- Changes are validated and cached data is invalidated for consistency.\n- Returns error if update rules are violated.\n- Logs all update attempts and errors.`,
	} as ApiOperationOptions,
};
