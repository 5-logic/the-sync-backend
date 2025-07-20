import { ApiOperationOptions } from '@nestjs/swagger';

export const StudentSelfDocs = {
	update: {
		summary: 'Update my profile',
		description: `Allow students to update their own profile information.\n\n- **Authorization:** Student access only (authenticated user).\n- **Validations:**\n  - Students can only update their own profile.\n  - Cannot modify student code, email, or major (admin only).\n  - Skills and responsibilities are completely replaced when provided (not merged).\n- **Business logic:**\n  - Updates full name, gender, phone number, skills, and expected responsibilities.\n- **Error handling:**\n  - Returns error if unauthorized or data is invalid.\n- **Logging:** Logs all update attempts and errors.`,
	} as ApiOperationOptions,
};
