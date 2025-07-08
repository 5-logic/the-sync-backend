import { ApiOperationOptions } from '@nestjs/swagger';

export const LecturerDocs = {
	create: {
		summary: 'Create lecturer',
		description:
			'Create a new lecturer account with automatic password generation and email verification. The system generates a secure password, creates the user profile, assigns lecturer role, and sends a welcome email with login credentials. **Admin access only.**',
	} as ApiOperationOptions,

	createMany: {
		summary: 'Import lecturers',
		description:
			'Bulk import multiple lecturer accounts from an array of user data. Each lecturer gets an auto-generated secure password and welcome email. Validates all entries before processing, ensures no duplicate emails, and performs the creation in a transaction for data integrity. Useful for mass onboarding of faculty members. **Admin access only.**',
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all lecturers',
		description:
			'Retrieve a comprehensive list of all lecturers in the system with their profile information including name, email, contact details, and moderator status. Results are cached for performance and ordered by creation date (newest first). Accessible for academic collaboration purposes. **Authenticated users only.**',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get lecturer by ID',
		description:
			'Retrieve detailed profile information for a specific lecturer by their unique user ID. Returns complete lecturer data including personal information, contact details, academic status, and moderator privileges. Used for viewing lecturer profiles, thesis supervision assignments, and administrative management. **Authenticated users only.**',
	} as ApiOperationOptions,

	update: {
		summary: 'Update lecturer profile',
		description:
			'Allow lecturers to update their own profile information including full name, contact details, and personal preferences. Lecturers can only modify their own profiles and cannot change their email address or role permissions. Changes are validated and cached data is invalidated for consistency. **Lecturer/Moderator access only.**',
	} as ApiOperationOptions,

	updateByAdmin: {
		summary: 'Update lecturer by admin',
		description:
			'Administrative update of any lecturer profile with extended permissions including email modification. Admins can update all lecturer information including sensitive data like email addresses and personal details. Includes comprehensive validation and maintains data integrity across the system. **Admin access only.**',
	} as ApiOperationOptions,

	toggleStatus: {
		summary: 'Toggle lecturer status',
		description:
			'Administrative control to toggle lecturer account status (active/inactive) and moderator privileges. Allows admins to activate/deactivate lecturer accounts and grant/revoke moderator permissions for thesis supervision and group management. Status changes are immediately effective and logged for audit purposes. **Admin access only.**',
	} as ApiOperationOptions,

	delete: {
		summary: 'Delete lecturer',
		description:
			'Permanently delete a lecturer account from the system with comprehensive validation checks. Prevents deletion if the lecturer has active assignments, supervisions, thesis reviews, or moderator responsibilities. Only inactive lecturers with no academic dependencies can be deleted to maintain data integrity. **Admin access only.**',
	} as ApiOperationOptions,
};
