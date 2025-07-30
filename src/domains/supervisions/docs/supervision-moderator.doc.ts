import { ApiOperationOptions } from '@nestjs/swagger';

export const SupervisionModeratorDocs = {
	assignBulkSupervisor: {
		summary: 'Assign supervisors to multiple theses',
		description: `Assign one or more lecturers as supervisors to multiple theses in bulk.\n\n- **Authorization:** Moderator access only (requires JWT and MODERATOR role).\n- **Validations:**\n  - All theses must exist and be in 'Approved' status.\n  - Each thesis must belong to a semester with status 'Preparing' or 'Picking'.\n  - Each assignment must have exactly 2 valid lecturers (existing and active).\n  - If a thesis already has supervisors, all old supervisors will be removed before assigning new ones.\n- **Business logic:**\n  - For each assignment, checks thesis, lecturer, thesis status, semester, and supervisor count.\n  - If a thesis is invalid (not approved, wrong semester), returns 400 with a list of invalid theses.\n  - If lecturers are invalid or not exactly 2, returns 400 with a list of invalid theses.\n  - If old supervisions exist, they are deleted before assigning new ones.\n  - Sends notification emails to assigned lecturers.\n  - Returns an array of results for each assignment, each item includes thesisId, lecturerId, status (success, already_exists, max_supervisors_reached, error), and error message if any.\n- **Response:**\n  - 200: Array<{ thesisId, lecturerId, status, error? }>\n- **Error handling:**\n  - 400: thesis not approved, invalid semester, or not exactly 2 lecturers.\n  - 404: thesis or lecturer not found.\n  - 409: lecturer already supervises the thesis or thesis already has 2 supervisors.\n- **Logging:** Logs all assignment attempts, errors, and notifications.`,
	} as ApiOperationOptions,

	changeSupervisor: {
		summary: 'Change thesis supervisor',
		description: `Change the supervisor of a thesis by replacing the current supervisor with a new one.\n\n- **Authorization:** Moderator access only (requires JWT and MODERATOR role).\n- **Validations:**\n  - Thesis, current supervisor, and new supervisor must exist and be active.\n  - The current supervision relationship must exist.\n  - The new supervisor must not already supervise this thesis.\n- **Business logic:**\n  - Updates the supervision to the new lecturer.\n  - Sends notification emails to both the old lecturer (removed) and the new lecturer (assigned).\n- **Response:**\n  - 200: { thesisId, lecturerId }\n- **Error handling:**\n  - 404: thesis, lecturer not found, or current supervision does not exist.\n  - 409: new lecturer already supervises this thesis.\n- **Logging:** Logs all change attempts, errors, and notifications.`,
	} as ApiOperationOptions,

	removeSupervisor: {
		summary: 'Remove supervisor from thesis',
		description: `Remove a lecturer from supervising a specific thesis by deleting the supervision relationship.\n\n- **Authorization:** Moderator access only (requires JWT and MODERATOR role).\n- **Validations:**\n  - Thesis and lecturer must exist.\n  - The supervision relationship must exist.\n  - After removal, the thesis must have at least 1 supervisor remaining.\n- **Business logic:**\n  - Deletes the supervision between the thesis and the lecturer.\n  - Sends a notification email to the lecturer who was removed.\n- **Response:**\n  - 200: { thesisId, lecturerId }\n- **Error handling:**\n  - 404: thesis, lecturer, or supervision not found.\n  - 400: cannot remove if only 1 supervisor remains.\n- **Logging:** Logs all removal attempts, errors, and notifications.`,
	} as ApiOperationOptions,
};
