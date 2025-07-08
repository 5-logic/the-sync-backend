import { ApiOperationOptions } from '@nestjs/swagger';

export const AuthDocs = {
	adminLogin: {
		summary: 'Admin login',
		description:
			'Authenticate admin with username and password. Returns access token and refresh token for admin access.',
	} as ApiOperationOptions,

	adminRefresh: {
		summary: 'Refresh admin token',
		description:
			'Generate new access token using refresh token. Refresh token must be valid and not expired.',
	} as ApiOperationOptions,

	adminLogout: {
		summary: 'Admin logout',
		description:
			'Logout admin and invalidate tokens. Requires valid admin access token. **Admin access only.**',
	} as ApiOperationOptions,

	userLogin: {
		summary: 'User login',
		description:
			'Authenticate user (student/lecturer/moderator) with email and password. Returns access token and refresh token. User must be active.',
	} as ApiOperationOptions,

	userRefresh: {
		summary: 'Refresh user token',
		description:
			'Generate new access token using refresh token. Refresh token must be valid and user must be active.',
	} as ApiOperationOptions,

	userLogout: {
		summary: 'User logout',
		description:
			'Logout user and invalidate tokens. Requires valid user access token. **Student/Lecturer/Moderator access only.**',
	} as ApiOperationOptions,

	requestPasswordReset: {
		summary: 'Request password reset',
		description:
			'Send OTP to user email for password reset. User must exist and be active. OTP expires in 10 minutes.',
	} as ApiOperationOptions,

	verifyOtpAndResetPassword: {
		summary: 'Verify OTP and reset password',
		description:
			'Verify OTP code and generate new password. OTP must be valid and not expired. New password will be sent via email.',
	} as ApiOperationOptions,

	changePassword: {
		summary: 'Change password',
		description:
			'Change user password with current password verification. Requires valid user access token. **Student/Lecturer/Moderator access only.**',
	} as ApiOperationOptions,
};
