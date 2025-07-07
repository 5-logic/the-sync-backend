import { ApiOperationOptions } from '@nestjs/swagger';

export const SupervisionDocs: Record<string, ApiOperationOptions> = {
	assignSupervisor: {
		summary: 'Assign supervisor to thesis',
		description:
			'Assigns a lecturer as supervisor to a thesis project. This endpoint creates a new supervision relationship between a lecturer and a thesis. The requesting user must have MODERATOR role privileges. Validates that both thesis and lecturer exist, checks if lecturer has capacity for additional supervisions, and ensures no duplicate supervision exists. Creates supervision record with proper timestamps and status tracking. Used in thesis management workflow when assigning academic supervisors to student thesis projects.',
	},
	changeSupervisor: {
		summary: 'Change thesis supervisor',
		description:
			'Changes the supervisor of a thesis by replacing the current supervisor with a new one. This endpoint updates an existing supervision relationship. The requesting user must have MODERATOR role privileges. Validates that both thesis and new lecturer exist, checks if new lecturer has capacity for additional supervisions, and ensures the new supervisor is different from current one. Updates supervision record with proper timestamps and maintains supervision history. Used in thesis management when reassigning academic supervision due to availability changes, expertise requirements, or administrative needs.',
	},
	removeSupervisor: {
		summary: 'Remove supervisor from thesis',
		description:
			'Removes a lecturer from supervising a specific thesis by deleting the supervision relationship. This endpoint terminates the supervision assignment between a lecturer and thesis. The requesting user must have MODERATOR role privileges. Validates that both thesis and lecturer exist and that an active supervision relationship exists between them. Removes supervision record while maintaining audit trail. Used in thesis management when supervision needs to be terminated due to lecturer unavailability, thesis cancellation, or administrative restructuring.',
	},
	getSupervisionsByThesis: {
		summary: 'Get supervisions by thesis',
		description:
			'Retrieves all supervision relationships for a specific thesis. This endpoint returns comprehensive information about all lecturers currently supervising or previously supervised the specified thesis. Includes supervision details such as supervisor information, assignment dates, status, and any supervision history. Used in thesis management to view supervision assignments, track supervisor changes, and manage academic oversight. Accessible to authenticated users with appropriate permissions.',
	},
	getSupervisionsByLecturer: {
		summary: 'Get supervisions by lecturer',
		description:
			'Retrieves all supervision relationships for a specific lecturer. This endpoint returns comprehensive information about all theses currently or previously supervised by the specified lecturer. Includes supervision details such as thesis information, student details, assignment dates, status, and supervision workload metrics. Used in lecturer management to view supervision portfolio, track workload distribution, and manage academic assignments. Accessible to authenticated users with appropriate permissions.',
	},
};
