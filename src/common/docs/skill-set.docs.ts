import { ApiOperationOptions } from '@nestjs/swagger';

export const SkillSetDocs = {
	findAll: {
		summary: 'Get all skill sets',
		description: `Retrieve all skill sets available in the system with their associated skills.\n\n- **Authorization:** Authenticated users only (JWT required).\n- **Business logic:**\n  - Returns all skill sets, each with a categorized collection of related technical skills.\n  - Skills within each set are sorted alphabetically.\n  - Uses cache-aside pattern for performance; results are cached for subsequent requests.\n- **Error handling:**\n  - Returns server error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get skill set by ID',
		description: `Retrieve detailed information about a specific skill set including all associated skills.\n\n- **Authorization:** Authenticated users only (JWT required).\n- **Business logic:**\n  - Returns the skill set and all associated skills, sorted alphabetically.\n  - Uses cache-aside pattern for performance; result is cached for subsequent requests.\n- **Error handling:**\n  - Returns 404 if skill set is not found.\n  - Returns server error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,
};
