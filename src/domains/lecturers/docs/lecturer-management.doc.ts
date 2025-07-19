import { ApiOperationOptions } from '@nestjs/swagger';

export const LecturerManagementDocs = {
	create: {
		summary: 'Create lecturer',
		description: `Create a new lecturer account with automatic password generation and email notification.\n\n- **Admin access only** (authentication and ADMIN role required).\n- System generates a secure password, creates the user profile, assigns lecturer role, and sends a welcome email with login credentials.\n- Validates that the email is unique.\n- Returns error if email already exists.\n- Logs all creation attempts and errors.`,
	} as ApiOperationOptions,

	createMany: {
		summary: 'Import lecturers',
		description: `Bulk import multiple lecturer accounts from an array of user data.\n\n- **Admin access only**.\n- Each lecturer gets an auto-generated secure password and welcome email.\n- Validates all entries before processing, ensures no duplicate emails, and performs the creation in a transaction for data integrity.\n- Returns error if any email already exists.\n- Logs all import attempts and errors.`,
	} as ApiOperationOptions,

	updateByAdmin: {
		summary: 'Update lecturer by admin',
		description: `Administrative update of any lecturer profile with extended permissions including email modification.\n\n- **Admin access only**.\n- Admins can update all lecturer information including sensitive data like email addresses and personal details.\n- Includes comprehensive validation and maintains data integrity across the system.\n- Returns error if update rules are violated.\n- Logs all update attempts and errors.`,
	} as ApiOperationOptions,

	toggleStatus: {
		summary: 'Toggle lecturer status',
		description: `Administrative control to toggle lecturer account status (active/inactive) and moderator privileges.\n\n- **Admin access only**.\n- Allows admins to activate/deactivate lecturer accounts and grant/revoke moderator permissions for thesis supervision and group management.\n- Status changes are immediately effective and logged for audit purposes.\n- Returns error if toggle rules are violated.\n- Logs all status change attempts and errors.`,
	} as ApiOperationOptions,

	delete: {
		summary: 'Delete lecturer',
		description: `Permanently delete a lecturer account from the system with comprehensive validation checks.\n\n- **Admin access only**.\n- Prevents deletion if the lecturer has active assignments, supervisions, thesis reviews, or moderator responsibilities.\n- Only inactive lecturers with no academic dependencies can be deleted to maintain data integrity.\n- Returns error if delete rules are violated.\n- Logs all deletion attempts and errors.`,
	} as ApiOperationOptions,
};
