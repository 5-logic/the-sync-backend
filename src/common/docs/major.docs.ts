import { ApiOperationOptions } from '@nestjs/swagger';

export const MajorDocs = {
	findAll: {
		summary: 'Get all majors',
		description: `Retrieve a list of all available majors in the system.\n\n- **Authenticated users only** (requires login).\n- Returns major code, name, and other relevant details.\n- Results are ordered alphabetically by name.\n- Used for academic program selection, student enrollment, and reporting.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get major by ID',
		description: `Retrieve detailed information for a specific major by its unique ID.\n\n- **Authenticated users only**.\n- Returns all available data for the major, including code, name, and description.\n- Returns 404 error if the major does not exist.\n- Used for viewing major details, academic planning, and validation.\n- Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,
};
