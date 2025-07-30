import { ApiOperationOptions } from '@nestjs/swagger';

export const GroupSubmissionStudentDocs = {
	create: {
		summary: 'Submit assignment for milestone',
		description: `Create a new submission for a specific group and milestone, with optional document attachments.\n\n- **Authorization:** Student (group leader) only.\n- **Validations:**\n  - Only group leaders can submit.\n  - Submission is only allowed before the milestone start date.\n  - Semester must be in ONGOING status.\n  - Group and milestone must exist and belong to the same semester.\n  - Prevents duplicate submissions for the same group-milestone.\n  - All documents must be non-empty strings.\n- **Business logic:**\n  - Associates submission with group and milestone.\n  - Uses transactions for consistency.\n  - Triggers cache invalidation.\n- **Response:**\n  - Returns the created or updated submission object (id, groupId, milestoneId, documents, status, createdAt, updatedAt, etc).\n- **Error handling:**\n  - 403 if not group leader.\n  - 404 if group or milestone not found.\n  - 409 if submission already exists or outside allowed period.\n- **Logging:** Logs all creation attempts and errors.`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update submission',
		description: `Update an existing submission for a specific group and milestone, including document attachments.\n\n- **Authorization:** Student (group leader) only.\n- **Validations:**\n  - Only group leaders can update.\n  - Update is only allowed before the milestone start date.\n  - Semester must be in ONGOING status.\n  - Group and milestone must exist and belong to the same semester.\n  - Submission must exist.\n  - All documents must be non-empty strings.\n- **Business logic:**\n  - Updates submission timestamp and document files.\n  - Uses transactions for consistency.\n  - Triggers cache invalidation.\n- **Response:**\n  - Returns the updated submission object (id, groupId, milestoneId, documents, status, createdAt, updatedAt, etc).\n- **Error handling:**\n  - 403 if not group leader.\n  - 404 if submission, group, or milestone not found.\n  - 409 if update outside allowed period.\n- **Logging:** Logs all update attempts and errors.`,
	} as ApiOperationOptions,
};
