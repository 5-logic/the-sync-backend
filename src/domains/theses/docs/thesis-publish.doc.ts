import { ApiOperationOptions } from '@nestjs/swagger';

export const ThesisPublishDocs = {
	findAll: {
		summary: 'Get all theses',
		description: `Retrieve a comprehensive list of all thesis projects.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns detailed information including versions, required skills, and metadata.\n  - No caching for list operations to ensure real-time data.\n- **Error handling:**\n  - 500 on database errors.\n- **Logging:** Logs all fetch attempts and errors.\n\n**Status Codes:**\n- **200 OK:** Successfully retrieved theses\n- **401 Unauthorized:** Invalid or missing authentication token\n- **500 Internal Server Error:** Database or server error`,
	} as ApiOperationOptions,

	findAllBySemesterId: {
		summary: 'Get theses by semester',
		description: `Retrieve all thesis projects associated with a specific semester.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns thesis information filtered by semester, including project details, status, supervisor assignments, and student enrollments.\n  - No caching for list operations.\n- **Error handling:**\n  - 404 if semester not found.\n  - 500 on database errors.\n- **Logging:** Logs all fetch attempts and errors.\n\n**Status Codes:**\n- **200 OK:** Successfully retrieved theses for the semester\n- **401 Unauthorized:** Invalid or missing authentication token\n- **404 Not Found:** Semester does not exist\n- **500 Internal Server Error:** Database or server error`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get thesis by ID',
		description: `Retrieve detailed information about a specific thesis project by its unique identifier.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns thesis data including title, description, domain, required skills, status, supervision details, student assignments, milestones, and progress.\n  - Uses cache-aside pattern for performance.\n- **Error handling:**\n  - 404 if thesis not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.\n\n**Status Codes:**\n- **200 OK:** Successfully retrieved thesis details\n- **401 Unauthorized:** Invalid or missing authentication token\n- **404 Not Found:** Thesis does not exist\n- **500 Internal Server Error:** Database or server error`,
	} as ApiOperationOptions,
};
