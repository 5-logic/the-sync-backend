import { ApiOperationOptions } from '@nestjs/swagger';

export const SubmissionDocs = {
	create: {
		summary: 'Submit assignment for milestone',
		description:
			'Create a new submission for a specific group and milestone with optional document attachments. Group ID and milestone ID are extracted from URL parameters. Only group leaders can submit assignments for their group during the creation period (before milestone startDate). Validates that the current time is before the milestone start date and the semester is in ONGOING status. Prevents duplicate submissions for the same group-milestone combination. Documents should be provided as an array of URLs or file paths in the request body. Automatically associates the submission with the group and milestone. Note: Creation is only allowed before the milestone start date, updates can be made until the end date. **Student access only (group leaders only).**',
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all submissions (Admin/Lecturer)',
		description:
			'Retrieve all submissions across all groups and milestones with comprehensive details including group information, milestone details, document attachments, and review status. Only accessible to administrators and lecturers for monitoring and evaluation purposes. Results include assignment reviews and feedback from lecturers. **Accessible by Admin and Lecturer roles only.**',
	} as ApiOperationOptions,

	findByGroupId: {
		summary: 'Get group submissions',
		description:
			'Retrieve all submissions for a specific group across all milestones including document attachments. Group members can view their own group submissions, while administrators and lecturers can view any group submissions. Returns submission history with milestone information, document files, and review details. Useful for tracking group progress throughout the semester. **Accessible by Group members, Admin, and Lecturer roles.**',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get submission for specific milestone',
		description:
			'Get detailed submission information for a specific group and milestone combination including all document attachments. Returns comprehensive data including group details, milestone information, document files, assignment reviews, and lecturer feedback. Group members can view their own submissions, while administrators and lecturers can view any submission. Includes checklist reviews and evaluation details. **Accessible by Group members, Admin, and Lecturer roles.**',
	} as ApiOperationOptions,

	update: {
		summary: 'Update submission',
		description:
			'Update an existing submission for a specific group and milestone, including document attachments. Group ID and milestone ID are extracted from URL parameters. Only group leaders can update their group submissions during the update period (before milestone endDate). Validates that the current time is before the milestone end date and semester status is ONGOING. Can update document files by providing a new documents array in the request body. Updates the submission timestamp and triggers cache invalidation. Useful for resubmitting or modifying assignment content and documents. Note: Updates are only allowed before the milestone end date, creation must be done before the start date. **Student access only (group leaders only).**',
	} as ApiOperationOptions,

	remove: {
		summary: 'Delete submission (Admin/Lecturer)',
		description:
			'Delete a submission by ID. Only administrators and lecturers can remove submissions, typically for administrative purposes or in case of violations. Removes all associated data including reviews and feedback. This action is irreversible and should be used with caution. Triggers cache invalidation for affected group and milestone data. **Admin and Lecturer access only.**',
	} as ApiOperationOptions,
};
