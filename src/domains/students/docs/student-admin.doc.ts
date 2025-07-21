import { ApiOperationOptions } from '@nestjs/swagger';

export const StudentAdminDocs = {
	create: {
		summary: 'Create student',
		description: `Create a new student or enroll an existing student in a semester.\n\n- **Authorization:** Admin access only.\n- **Validations:**\n  - Semester must be in PREPARING status.\n  - If student already exists (by student code), enrolls them in the specified semester with a new password.\n- **Business logic:**\n  - Automatically generates a secure password.\n  - Sends welcome email with login credentials.\n  - Uses database transactions for consistency.\n- **Error handling:**\n  - Returns error if semester is not in PREPARING status.\n  - Returns error if student data is invalid.\n- **Logging:** Logs all creation attempts and errors.`,
	} as ApiOperationOptions,

	createMany: {
		summary: 'Import students in batch',
		description: `Import multiple students in a single operation for a specific semester and major.\n\n- **Authorization:** Admin access only.\n- **Validations:**\n  - Semester must be in PREPARING status.\n  - For each student: creates new account if not exists, or enrolls existing student with new password.\n- **Business logic:**\n  - Automatically generates secure passwords.\n  - Sends bulk welcome emails.\n  - Uses database transactions for data consistency.\n- **Error handling:**\n  - Returns error if semester is not in PREPARING status.\n  - Returns error if any student data is invalid.\n- **Logging:** Logs all import attempts and errors.`,
	} as ApiOperationOptions,

	updateByAdmin: {
		summary: 'Update student by admin',
		description: `Allow administrators to update any student information.\n\n- **Authorization:** Admin access only.\n- **Business logic:**\n  - Full administrative access to modify all student data (email, personal details, student code, major assignment, etc.).\n  - Uses database transactions to ensure data consistency across user and student tables.\n- **Error handling:**\n  - Returns error if student not found or data is invalid.\n- **Logging:** Logs all update attempts and errors.`,
	} as ApiOperationOptions,

	toggleStatus: {
		summary: 'Toggle student active status',
		description: `Enable or disable a student account by toggling their active status.\n\n- **Authorization:** Admin access only.\n- **Business logic:**\n  - When disabled, students cannot log in or access the system.\n  - Useful for temporary account suspension or reactivation.\n- **Error handling:**\n  - Returns error if student not found or database fails.\n- **Logging:** Logs all status change attempts and errors.`,
	} as ApiOperationOptions,

	delete: {
		summary: 'Delete student from semester',
		description: `Remove a student from a specific semester or delete the student entirely.\n\n- **Authorization:** Admin access only.\n- **Validations:**\n  - Can only be done when semester is in PREPARING status.\n  - If student is enrolled in multiple semesters, only removes enrollment from specified semester.\n  - If only enrolled in one semester, completely removes student and user account.\n- **Business logic:**\n  - Uses database transactions for consistency.\n- **Error handling:**\n  - Returns error if semester is not in PREPARING status or student not found.\n- **Logging:** Logs all deletion attempts and errors.`,
	} as ApiOperationOptions,
};
