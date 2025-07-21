import { ApiOperationOptions } from '@nestjs/swagger';

export const StudentDocs = {
	create: {
		summary: 'Create student',
		description: `Create a new student or enroll an existing student in a semester.\n\n- **Authorization:** Admin access only.\n- **Validations:**\n  - Semester must be in PREPARING status.\n  - If student already exists (by student code), enrolls them in the specified semester with a new password.\n- **Business logic:**\n  - Automatically generates a secure password.\n  - Sends welcome email with login credentials.\n  - Uses database transactions for consistency.\n- **Error handling:**\n  - Returns error if semester is not in PREPARING status.\n  - Returns error if student data is invalid.\n- **Logging:** Logs all creation attempts and errors.`,
	} as ApiOperationOptions,

	createMany: {
		summary: 'Import students in batch',
		description: `Import multiple students in a single operation for a specific semester and major.\n\n- **Authorization:** Admin access only.\n- **Validations:**\n  - Semester must be in PREPARING status.\n  - For each student: creates new account if not exists, or enrolls existing student with new password.\n- **Business logic:**\n  - Automatically generates secure passwords.\n  - Sends bulk welcome emails.\n  - Uses database transactions for data consistency.\n- **Error handling:**\n  - Returns error if semester is not in PREPARING status.\n  - Returns error if any student data is invalid.\n- **Logging:** Logs all import attempts and errors.`,
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all students',
		description: `Retrieve all students in the system with their basic information.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns formatted student data without sensitive information (e.g., passwords).\n  - Results are cached for performance optimization.\n- **Error handling:**\n  - Returns error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findAllBySemester: {
		summary: 'Get students by semester',
		description: `Retrieve all students enrolled in a specific semester.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns student information for those with active enrollments in the specified semester.\n  - Results are cached for performance.\n- **Error handling:**\n  - Returns error if semester not found or database/cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findStudentsWithoutGroup: {
		summary: 'Get students without group',
		description: `Retrieve students enrolled in a specific semester who are not yet assigned to any group.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns student details and major information.\n  - Useful for group assignment operations and tracking unassigned students.\n- **Error handling:**\n  - Returns error if semester not found or database/cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get student by ID',
		description: `Retrieve detailed information about a specific student by their user ID.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns comprehensive student data including personal information, student code, and major details.\n  - Results are cached for performance.\n- **Error handling:**\n  - Returns 404 if student not found.\n  - Returns error if database/cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update my profile',
		description: `Allow students to update their own profile information.\n\n- **Authorization:** Student access only (authenticated user).\n- **Validations:**\n  - Students can only update their own profile.\n  - Cannot modify student code, email, or major (admin only).\n  - Skills and responsibilities are completely replaced when provided (not merged).\n- **Business logic:**\n  - Updates full name, gender, phone number, skills, and expected responsibilities.\n- **Error handling:**\n  - Returns error if unauthorized or data is invalid.\n- **Logging:** Logs all update attempts and errors.`,
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
