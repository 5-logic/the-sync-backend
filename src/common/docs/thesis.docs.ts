import { ApiOperationOptions } from '@nestjs/swagger';

export const ThesisDocs = {
	create: {
		summary: 'Create new thesis',
		description: `Create a new thesis project proposal.\n\n- **Authorization:** Lecturer or Moderator only.\n- **Validations:**\n  - All required fields (title, description, domain, skills, etc.) must be provided.\n  - Title must be unique within the semester.\n  - Skill IDs must exist.\n- **Business logic:**\n  - Creates thesis record, initial version, and required skills.\n  - Assigns the creator as the first supervisor.\n  - Uses transactions for consistency.\n  - Triggers cache invalidation.\n- **Error handling:**\n  - 409 if title is not unique or creation fails.\n  - 404 if skill IDs do not exist.\n- **Logging:** Logs all creation attempts and errors.`,
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all theses',
		description: `Retrieve a comprehensive list of all thesis projects.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns detailed information including versions, required skills, and metadata.\n  - No caching for list operations to ensure real-time data.\n- **Error handling:**\n  - 500 on database errors.\n- **Logging:** Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findAllBySemesterId: {
		summary: 'Get theses by semester',
		description: `Retrieve all thesis projects associated with a specific semester.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns thesis information filtered by semester, including project details, status, supervisor assignments, and student enrollments.\n  - No caching for list operations.\n- **Error handling:**\n  - 404 if semester not found.\n  - 500 on database errors.\n- **Logging:** Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get thesis by ID',
		description: `Retrieve detailed information about a specific thesis project by its unique identifier.\n\n- **Authorization:** Authenticated users only.\n- **Business logic:**\n  - Returns thesis data including title, description, domain, required skills, status, supervision details, student assignments, milestones, and progress.\n  - Uses cache-aside pattern for performance.\n- **Error handling:**\n  - 404 if thesis not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findAllByLecturerId: {
		summary: 'Get theses by lecturer',
		description: `Retrieve all thesis projects supervised or created by a specific lecturer.\n\n- **Authorization:** Lecturer or Moderator only.\n- **Business logic:**\n  - Returns theses associated with the lecturer, including supervision assignments, proposals, project status, and student enrollments.\n  - No caching for list operations.\n- **Error handling:**\n  - 404 if lecturer not found.\n  - 500 on database errors.\n- **Logging:** Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,

	publishTheses: {
		summary: 'Publish theses for student selection',
		description: `Publish or unpublish a batch of thesis projects, making them available or unavailable for student selection.\n\n- **Authorization:** Moderator only.\n- **Validations:**\n  - All thesis IDs must exist.\n  - Only approved theses can be published.\n  - Cannot unpublish theses already selected by groups.\n- **Business logic:**\n  - Updates publication status for each thesis.\n  - Sends notification emails to lecturers.\n  - Triggers cache invalidation.\n- **Error handling:**\n  - 404 if thesis not found.\n  - 409 if not approved, already published/unpublished, or selected by group.\n- **Logging:** Logs all publish/unpublish attempts, notifications, and errors.`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update thesis information',
		description: `Update detailed information of a specific thesis project.\n\n- **Authorization:** Lecturer or Moderator only.\n- **Validations:**\n  - Only the creator/assigned lecturer can update.\n  - All required fields must be valid.\n  - Skill IDs must exist.\n- **Business logic:**\n  - Updates thesis properties and creates new version if supporting document is provided.\n  - Updates required skills.\n  - Uses transactions for consistency.\n  - Triggers cache invalidation.\n- **Error handling:**\n  - 403 if not the creator/lecturer.\n  - 404 if thesis not found.\n  - 409 if update fails.\n- **Logging:** Logs all update attempts and errors.`,
	} as ApiOperationOptions,

	submitForReview: {
		summary: 'Submit thesis for review',
		description: `Submit a thesis project for administrative review and approval.\n\n- **Authorization:** Lecturer or Moderator only.\n- **Validations:**\n  - Only the creator/assigned lecturer can submit.\n  - Thesis must be in New or Rejected status.\n- **Business logic:**\n  - Changes thesis status to Pending.\n  - Triggers cache invalidation and sends notification email.\n- **Error handling:**\n  - 403 if not the creator/lecturer.\n  - 404 if thesis not found.\n  - 409 if already pending/approved or invalid status.\n- **Logging:** Logs all submission attempts, notifications, and errors.`,
	} as ApiOperationOptions,

	reviewThesis: {
		summary: 'Review and approve/reject thesis',
		description: `Conduct administrative review of a submitted thesis project, with approval or rejection.\n\n- **Authorization:** Moderator only.\n- **Validations:**\n  - Thesis must be in Pending status and not published.\n  - Only Approved or Rejected status allowed.\n- **Business logic:**\n  - Updates thesis status and sends notification email.\n  - Triggers cache invalidation.\n- **Error handling:**\n  - 404 if thesis not found.\n  - 409 if already published or invalid status.\n- **Logging:** Logs all review attempts, notifications, and errors.`,
	} as ApiOperationOptions,

	assignThesis: {
		summary: 'Assign thesis to group',
		description: `Assign a thesis project to a specific student group.\n\n- **Authorization:** Moderator only.\n- **Validations:**\n  - Thesis must be approved and published.\n  - Group must exist, be in the same semester, and not already have a thesis.\n  - Thesis must not already be assigned.\n- **Business logic:**\n  - Assigns thesis to group and updates records.\n  - Triggers cache invalidation and sends notification emails.\n- **Error handling:**\n  - 404 if thesis or group not found.\n  - 409 if already assigned, not approved/published, or group already has thesis.\n- **Logging:** Logs all assignment attempts, notifications, and errors.`,
	} as ApiOperationOptions,

	remove: {
		summary: 'Delete thesis project',
		description: `Permanently remove a thesis project from the system.\n\n- **Authorization:** Lecturer or Moderator only.\n- **Validations:**\n  - Only the creator/assigned lecturer can delete.\n  - Thesis must be in New or Rejected status.\n- **Business logic:**\n  - Deletes thesis and all associated data.\n  - Triggers cache invalidation.\n- **Error handling:**\n  - 403 if not the creator/lecturer.\n  - 404 if thesis not found.\n  - 409 if status is not New or Rejected.\n- **Logging:** Logs all deletion attempts and errors.`,
	} as ApiOperationOptions,
};
