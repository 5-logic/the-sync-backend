import { ApiOperationOptions } from '@nestjs/swagger';

export const SemesterEnrollmentDocs = {
	update: {
		summary: 'Update enrollments for a semester',
		description: `Bulk update enrollment statuses for students in a specific semester.\n\n- **Admin only** (requires authentication and ADMIN role).\n- Accepts a list of enrollment updates (student, status, etc).\n- Validates allowed status transitions for each student (e.g., NotYet → Ongoing/Failed/Passed, Ongoing → Failed/Passed).\n- Returns error if any transition is invalid.\n- Automatically sends notification emails to students when their enrollment status changes.\n- Logs the update process and any errors in detail.`,
	} as ApiOperationOptions,

	findGroups: {
		summary: 'Get all groups by semesterId with details',
		description: `Get all groups in a semester, including:\n- Group info\n- All group members (with user, major, and enrollments in this semester)\n- Thesis of the group (if any)\n- Supervisions of the thesis (with lecturer and user info)\n\n**Admin only** (requires authentication and ADMIN role).`,
	} as ApiOperationOptions,
};
