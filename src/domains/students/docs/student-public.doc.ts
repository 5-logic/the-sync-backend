import { ApiOperationOptions } from '@nestjs/swagger';

export const StudentPublicDocs = {
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
};
