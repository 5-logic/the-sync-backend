import { ApiOperationOptions } from '@nestjs/swagger';

export const AuthDocs = {
	adminLogin: {
		summary: 'Admin login',
		description: 'Authenticate admin with username and password.',
	} as ApiOperationOptions,

	adminRefresh: {
		summary: 'Refresh admin token',
		description: 'Generate new access token using refresh token.',
	} as ApiOperationOptions,

	adminLogout: {
		summary: 'Admin logout',
		description: 'Logout admin and invalidate tokens.',
	} as ApiOperationOptions,

	userLogin: {
		summary: 'User login',
		description: 'Authenticate user with email and password.',
	} as ApiOperationOptions,

	userRefresh: {
		summary: 'Refresh user token',
		description: 'Generate new access token using refresh token.',
	} as ApiOperationOptions,

	userLogout: {
		summary: 'User logout',
		description: 'Logout user and invalidate tokens.',
	} as ApiOperationOptions,

	requestPasswordReset: {
		summary: 'Request password reset',
		description: 'Send OTP to user email for password reset.',
	} as ApiOperationOptions,

	verifyOtpAndResetPassword: {
		summary: 'Verify OTP and reset password',
		description: 'Verify OTP code and generate new password.',
	} as ApiOperationOptions,

	changePassword: {
		summary: 'Change password',
		description: 'Change user password with current password verification.',
	} as ApiOperationOptions,
};
