import { ApiOperationOptions } from '@nestjs/swagger';

export const SemesterDocs = {
	create: {
		summary: 'Create a new semester',
		description: `Create a new semester with a unique name and code.\n\n- **Admin only** (requires authentication and ADMIN role).\n- Validates that no other semester is currently active (status other than NotYet or End) before allowing creation.\n- Returns an error if the name or code already exists.\n- The initial status is set to NotYet.\n- Clears related cache after creation.\n- Logs detailed creation process and errors if any.`,
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all semesters',
		description: `Retrieve the full list of semesters, ordered by newest creation date first.\n\n- **Authentication required** (all logged-in users can access).\n- No cache is used to ensure real-time data.\n- Returns complete information: status, group limits, phase, thesis quota, etc.\n- Logs the number of semesters found and any errors.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get semester details by ID',
		description: `Get detailed information of a semester by its ID.\n\n- **Authentication required**.\n- Uses cache (10 minutes TTL) for performance.\n- Returns 404 error if not found.\n- Returns all details: status, phase, group limits, thesis quota, etc.\n- Logs the query process and errors if any.`,
	} as ApiOperationOptions,

	update: {
		summary: 'Update semester',
		description: `Update semester information: status, group limits, ongoing phase, thesis quota, etc.\n\n- **Admin only** (requires authentication and ADMIN role).\n- Only allowed if the semester has not ended (status is not End).\n- Enforces business rules for status transitions: NotYet → Preparing → Picking → Ongoing → End.\n- When transitioning from Preparing to Picking, system checks that the number of public theses in the semester is at least equal to the number of groups.\n- When transitioning from Picking to Ongoing, system checks that all groups have picked a thesis.\n- When transitioning to Ongoing, automatically updates student enrollment status and sends notification emails.\n- When transitioning to End, checks that all students have completed enrollment.\n- Special validations:\n  + ongoingPhase can only be updated in Ongoing status.\n  + Cannot revert phase (e.g., ScopeLocked → ScopeAdjustable is not allowed).\n- Returns 409 or 403 error if business rules are violated.\n- Clears semester cache after update.\n- Logs update process and errors in detail.`,
	} as ApiOperationOptions,

	remove: {
		summary: 'Delete semester',
		description: `Permanently delete a semester from the system.\n\n- **Admin only** (requires authentication and ADMIN role).\n- Only semesters in NotYet status can be deleted.\n- Cannot delete if the semester has related data: groups, enrollments, milestones, studentGroupParticipations, etc.\n- Returns 409 error if related data exists.\n- Clears semester cache after deletion.\n- Logs deletion process and errors in detail.`,
	} as ApiOperationOptions,

	updateEnrollments: {
		summary: 'Update enrollments for a semester',
		description: `Bulk update enrollment statuses for students in a specific semester.\n\n- **Admin only** (requires authentication and ADMIN role).\n- Accepts a list of enrollment updates (student, status, etc).\n- Validates allowed status transitions for each student (e.g., NotYet → Ongoing/Failed/Passed, Ongoing → Failed/Passed).\n- Returns error if any transition is invalid.\n- Automatically sends notification emails to students when their enrollment status changes.\n- Logs the update process and any errors in detail.`,
	} as ApiOperationOptions,
};
