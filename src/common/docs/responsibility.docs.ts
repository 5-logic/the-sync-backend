import { ApiOperationOptions } from '@nestjs/swagger';

export const ResponsibilityDocs = {
	findAll: {
		summary: 'Get all responsibilities',
		description: `Retrieve all responsibility definitions available in the system.\n\n- **Authorization:** Authenticated users only (JWT required).\n- **Business logic:**\n  - Returns all responsibilities ordered by name.\n  - Uses cache-aside pattern for performance; results are cached for subsequent requests.\n- **Error handling:**\n  - Returns server error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.\n- **Purpose:** Responsibilities define the expected roles and duties that group members should fulfill during project work.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get responsibility by ID',
		description: `Retrieve detailed information about a specific responsibility by its unique identifier.\n\n- **Authorization:** Authenticated users only (JWT required).\n- **Business logic:**\n  - Returns the responsibility definition including name and description.\n  - Uses cache-aside pattern for performance; result is cached for subsequent requests.\n- **Error handling:**\n  - Returns 404 if responsibility is not found.\n  - Returns server error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,
};
