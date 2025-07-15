import { ApiOperationOptions } from '@nestjs/swagger';

export const ChangePasswordDocs = {
	changePassword: {
		summary: 'Change password',
		description: `Change the current user's password.\n\n- Requires valid user access token.\n- **Student, Lecturer, or Moderator access only** (authentication and correct role required).\n- Verifies current password before allowing change.\n- New password must meet complexity requirements.\n- Logs all change attempts and errors.\n- Returns error if current password is incorrect or new password is invalid.`,
	} as ApiOperationOptions,
};
