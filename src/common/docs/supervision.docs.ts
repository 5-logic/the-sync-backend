import { ApiOperationOptions } from '@nestjs/swagger';

export const SupervisionDocs: Record<string, ApiOperationOptions> = {
	assignBulkSupervisor: {
		summary: 'Assign supervisors to multiple theses',
		description:
			'Assigns one or more lecturers as supervisors to multiple theses. Validates that all theses and lecturers exist, checks if lecturers have capacity for additional supervisions, and ensures no duplicate supervision exists. Used in bulk thesis management workflows for assigning academic supervisors efficiently. **Moderator access only.**',
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
