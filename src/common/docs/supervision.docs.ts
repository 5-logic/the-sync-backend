import { ApiOperationOptions } from '@nestjs/swagger';

export const SupervisionDocs: Record<string, ApiOperationOptions> = {
	assignSupervisor: {
		summary: 'Assign supervisor to thesis',
		description:
			'Assigns a lecturer as supervisor to a thesis project. Creates a new supervision relationship between a lecturer and a thesis. Validates that both thesis and lecturer exist, checks if lecturer has capacity for additional supervisions, and ensures no duplicate supervision exists. Used in thesis management workflow when assigning academic supervisors to student thesis projects. **Moderator access only.**',
	},
	changeSupervisor: {
		summary: 'Change thesis supervisor',
		description:
			'Changes the supervisor of a thesis by replacing the current supervisor with a new one. Updates an existing supervision relationship. Validates that both thesis and new lecturer exist, checks if new lecturer has capacity for additional supervisions, and ensures the new supervisor is different from current one. Used when reassigning academic supervision due to availability changes or expertise requirements. **Moderator access only.**',
	},
	removeSupervisor: {
		summary: 'Remove supervisor from thesis',
		description:
			'Removes a lecturer from supervising a specific thesis by deleting the supervision relationship. Terminates the supervision assignment between a lecturer and thesis. Validates that both thesis and lecturer exist and that an active supervision relationship exists between them. Used when supervision needs to be terminated due to lecturer unavailability or administrative restructuring. **Moderator access only.**',
	},
	getSupervisionsByThesis: {
		summary: 'Get supervisions by thesis',
		description:
			'Retrieves all supervision relationships for a specific thesis. Returns comprehensive information about all lecturers currently supervising or previously supervised the specified thesis. Includes supervision details such as supervisor information, assignment dates, status, and supervision history. **Authenticated users only.**',
	},
	getSupervisionsByLecturer: {
		summary: 'Get supervisions by lecturer',
		description:
			'Retrieves all supervision relationships for a specific lecturer. Returns comprehensive information about all theses currently or previously supervised by the specified lecturer. Includes supervision details such as thesis information, student details, assignment dates, status, and supervision workload metrics. **Authenticated users only.**',
	},
};
