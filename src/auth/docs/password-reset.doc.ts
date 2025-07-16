import { ApiOperationOptions } from '@nestjs/swagger';

export const PasswordResetDocs = {
	request: {
		summary: 'Request password reset',
		description: `Send OTP code to user's email for password reset.\n\n- User must exist and be active.\n- OTP is valid for 10 minutes.\n- Stores OTP in cache and sends via email.\n- Logs all requests and errors.\n- Returns error if user does not exist or is inactive.`,
	} as ApiOperationOptions,

	verify: {
		summary: 'Verify OTP and reset password',
		description: `Verify OTP code and generate a new password for the user.\n\n- User must exist and be active.\n- OTP must match and not be expired.\n- Generates a new strong password and updates user account.\n- Removes OTP from cache after use.\n- Sends new password to user's email.\n- Logs all verification attempts and errors.\n- Returns error if OTP is invalid, expired, or user is inactive.`,
	} as ApiOperationOptions,
};
