import { ApiOperationOptions } from '@nestjs/swagger';

export const AdminDocs = {
	findOne: {
		summary: 'Get admin by ID',
		description: `Retrieve admin details by ID.\n\n- **Admin only** (requires authentication and ADMIN role).\n- Returns admin information with password field omitted.\n- Returns 404 error if admin is not found.\n- Logs all access and errors.`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update current admin profile',
		description: `Update the current admin's email and/or password.\n\n- **Admin only** (requires authentication and ADMIN role).\n- Only the authenticated admin can update their own profile.\n- To change password: both \`oldPassword\` and \`newPassword\` are required.\n- New password must be different from the current password.\n- Old password must match the current password (verified).\n- Password must meet complexity requirements (at least 12 characters, uppercase, number, special character).\n- Email must be a valid format.\n- If no valid fields are provided, returns the current admin info.\n- Returns 404 error if admin is not found.\n- Logs all update attempts and errors.\n\n**Fields:**\n- \`email\`: Optional - Update admin email address.\n- \`oldPassword\`: Required when changing password - Current password for verification.\n- \`newPassword\`: Required when changing password - New password (must meet complexity requirements).`,
	} as ApiOperationOptions,
};
