import { ApiOperationOptions } from '@nestjs/swagger';

export const SupervisionPublicDocs = {
	getSupervisionsByThesis: {
		summary: 'Get supervisions by thesis',
		description: `Retrieve all supervision relationships for a specific thesis.\n\n- **Authorization:** Authenticated users only (requires JWT).\n- **Business logic:**\n  - Returns all lecturers currently or previously supervising the specified thesis.\n  - Each supervision includes lecturerId and related information.\n- **Response:**\n  - 200: Array<{ lecturerId }>\n- **Error handling:**\n  - 404: thesis not found.\n  - 500: database errors.\n- **Logging:** Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	getSupervisionsByLecturer: {
		summary: 'Get supervisions by lecturer',
		description: `Retrieve all supervision relationships for a specific lecturer.\n\n- **Authorization:** Authenticated users only (requires JWT).\n- **Business logic:**\n  - Returns all theses currently or previously supervised by the specified lecturer.\n  - Each supervision includes thesisId and related information.\n- **Response:**\n  - 200: Array<{ thesisId }>\n- **Error handling:**\n  - 404: lecturer not found.\n  - 500: database errors.\n- **Logging:** Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	getSupervisionsGroupByLecturer: {
		summary: 'Get all groups (with members) supervised by a lecturer',
		description: `Returns a list of supervisions where the lecturer is supervising, only including theses that have been picked by a group (thesis.groupId != null).\n\n- **Authorization:** Authenticated users only (requires JWT).\n- **Business logic:**\n  - Only returns supervisions where the thesis has been picked by a group.\n  - Each supervision includes full thesis info, group info, and all members (student + user) of that group.\n  - The returned data helps to summarize and check the groups that the lecturer is actually supervising.\n- **Response:**\n  - 200: Array<{\n      supervision info,\n      thesis: {\n        group: {\n          studentGroupParticipations: [\n            { student: { user: {...} } }\n          ]\n        }\n      }\n    }>\n- **Error handling:**\n  - 404: lecturer not found.\n  - 500: database errors.\n- **Logging:** Logs all queries and errors.`,
	} as ApiOperationOptions,
};
