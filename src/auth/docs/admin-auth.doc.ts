import { ApiOperationOptions } from '@nestjs/swagger';

export const AdminAuthDocs = {
	login: {
		summary: 'Admin login',
		description: `Authenticate admin with username and password.\n\n- Returns access token and refresh token for admin access.\n- Only active admins can log in.\n- Logs all login attempts and errors.\n- Returns error if credentials are invalid.`,
	} as ApiOperationOptions,

	refresh: {
		summary: 'Refresh admin token',
		description: `Generate a new access token using a valid refresh token.\n\n- Only for admins.\n- Refresh token must be valid, not expired, and match the cached identifier.\n- Returns error if token is invalid, expired, or mismatched.\n- Logs all refresh attempts and errors.`,
	} as ApiOperationOptions,

	logout: {
		summary: 'Admin logout',
		description: `Logout admin and invalidate tokens.\n\n- Requires valid admin access token.\n- **Admin access only** (authentication and ADMIN role required).\n- Removes token identifiers from cache.\n- Logs all logout attempts and errors.`,
	} as ApiOperationOptions,
};
