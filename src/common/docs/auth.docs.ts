import { ApiOperationOptions } from '@nestjs/swagger';

export const AuthDocs = {
	adminLogin: {
		summary: 'Admin login',
		description: `Authenticate admin with username and password.\n\n- Returns access token and refresh token for admin access.\n- Only active admins can log in.\n- Logs all login attempts and errors.\n- Returns error if credentials are invalid.`,
	} as ApiOperationOptions,

	adminRefresh: {
		summary: 'Refresh admin token',
		description: `Generate a new access token using a valid refresh token.\n\n- Only for admins.\n- Refresh token must be valid, not expired, and match the cached identifier.\n- Returns error if token is invalid, expired, or mismatched.\n- Logs all refresh attempts and errors.`,
	} as ApiOperationOptions,

	adminLogout: {
		summary: 'Admin logout',
		description: `Logout admin and invalidate tokens.\n\n- Requires valid admin access token.\n- **Admin access only** (authentication and ADMIN role required).\n- Removes token identifiers from cache.\n- Logs all logout attempts and errors.`,
	} as ApiOperationOptions,

	userLogin: {
		summary: 'User login',
		description: `Authenticate user (student, lecturer, or moderator) with email and password.\n\n- Returns access token and refresh token.\n- User must exist and be active.\n- Determines user role dynamically.\n- Logs all login attempts and errors.\n- Returns error if credentials are invalid or user is inactive.`,
	} as ApiOperationOptions,

	userRefresh: {
		summary: 'Refresh user token',
		description: `Generate a new access token using a valid refresh token.\n\n- Only for students, lecturers, or moderators.\n- Refresh token must be valid, not expired, and match the cached identifier.\n- User must still be active.\n- Returns error if token is invalid, expired, mismatched, or user is inactive.\n- Logs all refresh attempts and errors.`,
	} as ApiOperationOptions,

	userLogout: {
		summary: 'User logout',
		description: `Logout user and invalidate tokens.\n\n- Requires valid user access token.\n- **Student, Lecturer, or Moderator access only** (authentication and correct role required).\n- Removes token identifiers from cache.\n- Logs all logout attempts and errors.`,
	} as ApiOperationOptions,

	requestPasswordReset: {
		summary: 'Request password reset',
		description: `Send OTP code to user's email for password reset.\n\n- User must exist and be active.\n- OTP is valid for 10 minutes.\n- Stores OTP in cache and sends via email.\n- Logs all requests and errors.\n- Returns error if user does not exist or is inactive.`,
	} as ApiOperationOptions,

	verifyOtpAndResetPassword: {
		summary: 'Verify OTP and reset password',
		description: `Verify OTP code and generate a new password for the user.\n\n- User must exist and be active.\n- OTP must match and not be expired.\n- Generates a new strong password and updates user account.\n- Removes OTP from cache after use.\n- Sends new password to user's email.\n- Logs all verification attempts and errors.\n- Returns error if OTP is invalid, expired, or user is inactive.`,
	} as ApiOperationOptions,

	changePassword: {
		summary: 'Change password',
		description: `Change the current user's password.\n\n- Requires valid user access token.\n- **Student, Lecturer, or Moderator access only** (authentication and correct role required).\n- Verifies current password before allowing change.\n- New password must meet complexity requirements.\n- Logs all change attempts and errors.\n- Returns error if current password is incorrect or new password is invalid.`,
	} as ApiOperationOptions,
};
