import { ApiOperationOptions } from '@nestjs/swagger';

export const SemesterDocs = {
	create: {
		summary: 'Create semester',
		description:
			'Create a new academic semester with unique name and code. Validates that no other semester is currently active (status other than NotYet or End) before allowing creation. System automatically sets initial status to NotYet. **Admin access only.**',
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all semesters',
		description:
			'Retrieve all academic semesters in the system ordered by creation date (newest first). Returns comprehensive semester information including status, group limits, and phase details. **Authenticated users only.**',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get semester by ID',
		description:
			'Retrieve detailed information about a specific semester by its unique identifier. Returns complete semester data including status, phase, group limits, and thesis quotas. **Authenticated users only.**',
	} as ApiOperationOptions,

	update: {
		summary: 'Update semester',
		description:
			'Update semester information including status transitions, group limits, and ongoing phase settings. Enforces strict business rules for status transitions (NotYet → Preparing → Picking → Ongoing → End). Validates phase changes and automatically updates student enrollment statuses when transitioning to Ongoing. Sends email notifications to students when semester becomes active. **Admin access only.**',
	} as ApiOperationOptions,

	remove: {
		summary: 'Delete semester',
		description:
			'Permanently delete a semester from the system. Can only delete semesters that have no associated data such as enrollments, groups, or thesis assignments. Validates that semester is safe to delete before performing deletion. **Admin access only.**',
	} as ApiOperationOptions,
};
