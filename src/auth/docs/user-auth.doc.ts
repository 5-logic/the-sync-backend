import { ApiOperationOptions } from '@nestjs/swagger';

export const UserAuthDocs = {
	login: {
		summary: 'User login',
		description: `Authenticate user (student, lecturer, or moderator) with email and password.\n\n- Returns access token and refresh token.\n- User must exist and be active.\n- Determines user role dynamically.\n- Logs all login attempts and errors.\n- Returns error if credentials are invalid or user is inactive.`,
	} as ApiOperationOptions,

	refresh: {
		summary: 'Refresh user token',
		description: `Generate a new access token using a valid refresh token.\n\n- Only for students, lecturers, or moderators.\n- Refresh token must be valid, not expired, and match the cached identifier.\n- User must still be active.\n- Returns error if token is invalid, expired, mismatched, or user is inactive.\n- Logs all refresh attempts and errors.`,
	} as ApiOperationOptions,

	logout: {
		summary: 'User logout',
		description: `Logout user and invalidate tokens.\n\n- Requires valid user access token.\n- **Student, Lecturer, or Moderator access only** (authentication and correct role required).\n- Removes token identifiers from cache.\n- Logs all logout attempts and errors.`,
	} as ApiOperationOptions,
};
