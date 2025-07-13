import { ApiOperationOptions } from '@nestjs/swagger';

export const SubmissionDocs = {
	create: {
		summary: 'Submit assignment for milestone',
		description: `Create a new submission for a specific group and milestone, with optional document attachments.\n\n- **Authorization:** Student (group leader) only.\n- **Validations:**\n  - Only group leaders can submit.\n  - Submission is only allowed before the milestone start date.\n  - Semester must be in ONGOING status.\n  - Prevents duplicate submissions for the same group-milestone.\n  - Documents must be non-empty strings.\n- **Business logic:**\n  - Associates submission with group and milestone.\n  - Uses transactions for consistency.\n  - Triggers cache invalidation.\n- **Error handling:**\n  - 403 if not group leader.\n  - 404 if group or milestone not found.\n  - 409 if submission already exists or outside allowed period.\n- **Logging:** Logs all creation attempts and errors.`,
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all submissions (Admin/Lecturer)',
		description: `Retrieve all submissions across all groups and milestones, including group info, milestone details, document attachments, and review status.\n\n- **Authorization:** Admin and Lecturer only.\n- **Business logic:**\n  - Returns all submissions with assignment reviews and lecturer feedback.\n  - Results are cached for performance.\n- **Error handling:**\n  - 403 if unauthorized.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findAllBySemester: {
		summary: 'Get submissions by semester (Moderator)',
		description: `Retrieve all submissions for a specific semester, including group and milestone info, review counts, and document attachments.\n\n- **Authorization:** Moderator only.\n- **Business logic:**\n  - Returns submissions for review, with reviewer and review counts.\n  - Results are cached for performance.\n- **Error handling:**\n  - 404 if semester not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findAllByMilestone: {
		summary: 'Get submissions by milestone (Moderator)',
		description: `Retrieve all submissions for a specific milestone, including group info, review counts, and document attachments.\n\n- **Authorization:** Moderator only.\n- **Business logic:**\n  - Returns submissions for review, with reviewer and review counts.\n  - Results are cached for performance.\n- **Error handling:**\n  - 404 if milestone not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findAllBySemesterAndMilestone: {
		summary: 'Get submissions by semester and milestone (Moderator)',
		description: `Retrieve all submissions for a specific semester and milestone, including group info, review counts, and document attachments.\n\n- **Authorization:** Moderator only.\n- **Business logic:**\n  - Returns submissions for review, with reviewer and review counts.\n  - Results are cached for performance.\n- **Error handling:**\n  - 404 if semester or milestone not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findByGroupId: {
		summary: 'Get group submissions',
		description: `Retrieve all submissions for a specific group across all milestones, including document attachments.\n\n- **Authorization:** Group members, Admin, and Lecturer.\n- **Business logic:**\n  - Returns submission history with milestone info, document files, and review details.\n  - Results are cached for performance.\n- **Error handling:**\n  - 403 if not a group member.\n  - 404 if group not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get submission for specific milestone',
		description: `Get detailed submission information for a specific group and milestone, including all document attachments.\n\n- **Authorization:** Group members, Admin, and Lecturer.\n- **Business logic:**\n  - Returns group details, milestone info, document files, assignment reviews, and lecturer feedback.\n  - Includes checklist reviews and evaluation details.\n- **Error handling:**\n  - 403 if not a group member.\n  - 404 if submission, group, or milestone not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update submission',
		description: `Update an existing submission for a specific group and milestone, including document attachments.\n\n- **Authorization:** Student (group leader) only.\n- **Validations:**\n  - Only group leaders can update.\n  - Update is only allowed before the milestone end date.\n  - Semester must be in ONGOING status.\n  - Documents must be non-empty strings.\n- **Business logic:**\n  - Updates submission timestamp and document files.\n  - Triggers cache invalidation.\n- **Error handling:**\n  - 403 if not group leader.\n  - 404 if submission, group, or milestone not found.\n  - 409 if update outside allowed period.\n- **Logging:** Logs all update attempts and errors.`,
	} as ApiOperationOptions,

	remove: {
		summary: 'Delete submission (Admin/Lecturer)',
		description: `Delete a submission by ID.\n\n- **Authorization:** Admin and Lecturer only.\n- **Business logic:**\n  - Removes all associated data, including reviews and feedback.\n  - Triggers cache invalidation for affected group and milestone.\n- **Error handling:**\n  - 403 if unauthorized.\n  - 404 if submission not found.\n  - 500 on database errors.\n- **Logging:** Logs all deletion attempts and errors.`,
	} as ApiOperationOptions,
};
