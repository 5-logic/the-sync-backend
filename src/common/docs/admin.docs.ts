import { ApiOperationOptions } from '@nestjs/swagger';

export const AdminDocs = {
	findOne: {
		summary: 'Get admin by ID',
		description:
			'Retrieve admin details by ID. Returns admin information without password field. **Admin access only.**',
	} as ApiOperationOptions,

	update: {
		summary: 'Update admin profile',
		description: `Update current admin email and/or password. 
		
**Requirements:**
- **Admin access only**
- To change password: Both \`oldPassword\` and \`newPassword\` are required
- New password must be different from current password
- Password must be at least 12 characters with uppercase, number, and special character
- Email must be valid format

**Fields:**
- \`email\`: Optional - Update admin email address
- \`oldPassword\`: Required when changing password - Current password for verification
- \`newPassword\`: Required when changing password - New password (must meet complexity requirements)`,
	} as ApiOperationOptions,
};
