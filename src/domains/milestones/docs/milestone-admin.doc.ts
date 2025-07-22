import { ApiOperationOptions } from '@nestjs/swagger';

export const MilestoneAdminDocs = {
	create: {
		summary: 'Create milestone',
		description:
			'**Admin access only.**\\n' +
			'\\n' +
			'- Only allowed when the semester status is `Ongoing`.\\n' +
			'- Validates semester existence and status.\\n' +
			'- Validates date range: start date cannot be in the past, start date must be before end date.\\n' +
			'- Prevents overlapping milestones and duplicate names within the same semester.\\n' +
			'- Automatically creates submission records for all groups in the semester.\\n' +
			'- Returns `409` if validation fails or milestone overlaps.\\n' +
			'- Logs all creation attempts and errors.',
	} as ApiOperationOptions,

	update: {
		summary: 'Update milestone',
		description:
			'**Admin access only.**\\n' +
			'\\n' +
			'- Only allowed before the milestone start date and when the semester status is `Ongoing`.\\n' +
			'- Validates date range and prevents overlaps or duplicate names.\\n' +
			'- Returns `409` if update rules are violated.\\n' +
			'- Logs all update attempts and errors.',
	} as ApiOperationOptions,

	delete: {
		summary: 'Delete milestone',
		description:
			'**Admin access only.**\\n' +
			'\\n' +
			'- Only allowed before the milestone start date and when the semester status is `Ongoing`.\\n' +
			'- Only allowed if all submissions in the milestone have status `NotSubmitted`.\\n' +
			'- Not allowed if there exists any related checklist, checklist item, review, review item, or assignment review.\\n' +
			'- Returns `409` if any of the above conditions are not met.\\n' +
			'- If allowed, deletes all submissions in the milestone before deleting the milestone itself.\\n' +
			'- Logs all deletion attempts, warnings, and errors.',
	} as ApiOperationOptions,
};
