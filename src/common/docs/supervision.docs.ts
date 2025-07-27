import { ApiOperationOptions } from '@nestjs/swagger';

export const SupervisionDocs: Record<string, ApiOperationOptions> = {
	assignBulkSupervisor: {
		summary: 'Assign supervisors to multiple theses',
		description: `Assign one or more lecturers as supervisors to multiple theses in bulk.\n\n- **Authorization:** Moderator access only.\n- **Validations:**\n  - All theses must exist and be in 'Approved' status.\n  - All lecturers must exist and be active.\n  - Each thesis can have a maximum of 2 supervisors.\n  - Prevents duplicate supervision assignments.\n- **Business logic:**\n  - For each assignment, checks lecturer and thesis existence, thesis approval status, current supervision count, and duplicates.\n  - If any thesis is not approved, returns a 400 error with a list of unapproved theses.\n  - Sends notification emails to lecturers on assignment.\n  - Returns detailed status for each assignment (success, already exists, max supervisors reached, error).\n- **Error handling:**\n  - 404 if thesis or lecturer not found.\n  - 400 if lecturer is inactive or thesis is not approved.\n  - 409 if duplicate or max supervisors reached.\n- **Logging:** Logs all assignment attempts, errors, and notifications.`,
	},
	changeSupervisor: {
		summary: 'Change thesis supervisor',
		description: `Change the supervisor of a thesis by replacing the current supervisor with a new one.\n\n- **Authorization:** Moderator access only.\n- **Validations:**\n  - Both thesis and new lecturer must exist and be active.\n  - New lecturer must not already supervise the thesis.\n  - Current supervision relationship must exist.\n- **Business logic:**\n  - Updates the supervision relationship to the new lecturer.\n  - Sends notification emails to both old and new lecturers.\n- **Error handling:**\n  - 404 if thesis or lecturers not found, or current supervision does not exist.\n  - 409 if new lecturer already supervises the thesis.\n- **Logging:** Logs all change attempts, errors, and notifications.`,
	},
	removeSupervisor: {
		summary: 'Remove supervisor from thesis',
		description: `Remove a lecturer from supervising a specific thesis by deleting the supervision relationship.\n\n- **Authorization:** Moderator access only.\n- **Validations:**\n  - Both thesis and lecturer must exist.\n  - Supervision relationship must exist.\n  - Each thesis must have at least 1 supervisor after removal.\n- **Business logic:**\n  - Deletes the supervision assignment.\n  - Sends notification email to the lecturer.\n- **Error handling:**\n  - 404 if thesis, lecturer, or supervision not found.\n  - 400 if trying to remove the last supervisor.\n- **Logging:** Logs all removal attempts, errors, and notifications.`,
	},
	getSupervisionsByThesis: {
		summary: 'Get supervisions by thesis',
		description: `Retrieve all supervision relationships for a specific thesis.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns all lecturers currently or previously supervising the specified thesis.\n  - Includes supervisor information, assignment dates, and status.\n- **Error handling:**\n  - 404 if thesis not found.\n  - 500 on database errors.\n- **Logging:** Logs all fetch attempts and errors.`,
	},
	getSupervisionsByLecturer: {
		summary: 'Get supervisions by lecturer',
		description: `Retrieve all supervision relationships for a specific lecturer.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns all theses currently or previously supervised by the specified lecturer.\n  - Includes thesis information, student details, assignment dates, and workload metrics.\n- **Error handling:**\n  - 404 if lecturer not found.\n  - 500 on database errors.\n- **Logging:** Logs all fetch attempts and errors.`,
	},
	getSupervisionsGroupByLecturer: {
		summary: 'Get all groups (with members) supervised by a lecturer',
		description: `Returns a list of supervisions where the lecturer is supervising, only including theses that have been picked by a group (thesis.groupId != null).\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Only returns supervisions where the thesis has been picked by a group.\n  - Each supervision includes full thesis info, group info, and all members (student + user) of that group.\n  - The returned data helps to summarize and check the groups that the lecturer is actually supervising.\n- **Response:**\n  - Each item includes: supervision info, thesis info, group info, and a list of members (studentGroupParticipations -> student -> user).\n- **Error handling:**\n  - 404 if lecturer not found.\n  - 500 on database errors.\n- **Logging:** Logs all queries and errors.`,
	},
};
