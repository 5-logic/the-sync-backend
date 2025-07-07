import { ApiOperationOptions } from '@nestjs/swagger';

export const SemesterDocs = {
	create: {
		summary: 'Create semester',
		description:
			'Create a new academic semester with unique name and code. Only administrators can create semesters. Validates that no other semester is currently active (status other than NotYet or End) before allowing creation. System automatically sets initial status to NotYet.',
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all semesters',
		description:
			'Retrieve all academic semesters in the system ordered by creation date (newest first). Returns comprehensive semester information including status, group limits, and phase details.',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get semester by ID',
		description:
			'Retrieve detailed information about a specific semester by its unique identifier. Returns complete semester data including status, phase, group limits, and thesis quotas.',
	} as ApiOperationOptions,

	update: {
		summary: 'Update semester',
		description:
			'Update semester information including status transitions, group limits, and ongoing phase settings. Only administrators can update semesters. Enforces strict business rules for status transitions (NotYet → Preparing → Picking → Ongoing → End). Validates phase changes and automatically updates student enrollment statuses when transitioning to Ongoing. Sends email notifications to students when semester becomes active.',
	} as ApiOperationOptions,

	remove: {
		summary: 'Delete semester',
		description:
			'Delete a semester from the system. Only administrators can delete semesters. Can only delete semesters with NotYet status and no existing relationships (no groups, enrollments, milestones, or student participations). Permanently removes the semester and all associated data.',
	} as ApiOperationOptions,
};
