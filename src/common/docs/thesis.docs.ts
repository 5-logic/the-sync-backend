import { ApiOperationOptions } from '@nestjs/swagger';

export const ThesisDocs = {
	create: {
		summary: 'Create new thesis',
		description:
			'Creates a new thesis project proposal. Allows users to create thesis proposals with detailed specifications including title, description, domain, required skills, and expected outcomes. Validates thesis data completeness, checks for title uniqueness within semester, and creates thesis record with proper status tracking. **Lecturer/Moderator access only.**',
	} as ApiOperationOptions,

	findAll: {
		summary: 'Get all theses',
		description:
			'Retrieves a comprehensive list of all thesis projects in the system. Returns detailed information about theses including titles, descriptions, status, supervisor assignments, student enrollments, and metadata. Supports filtering and pagination for efficient data retrieval. **Authenticated users only.**',
	} as ApiOperationOptions,

	findAllBySemesterId: {
		summary: 'Get theses by semester',
		description:
			'Retrieves all thesis projects associated with a specific semester. Returns comprehensive thesis information filtered by semester including project details, status, supervisor assignments, and student enrollments. Used in academic planning to view thesis offerings per semester and track semester-specific thesis distribution. **Authenticated users only.**',
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get thesis by ID',
		description:
			'Retrieves detailed information about a specific thesis project by its unique identifier. Returns comprehensive thesis data including title, description, domain, required skills, status, supervision details, student assignments, milestones, and progress tracking. **Authenticated users only.**',
	} as ApiOperationOptions,

	findAllByLecturerId: {
		summary: 'Get theses by lecturer',
		description:
			'Retrieves all thesis projects supervised or created by a specific lecturer. Returns comprehensive information about theses associated with the lecturer including supervision assignments, thesis proposals, project status, and student enrollments. Used in lecturer management to view supervision portfolio and track workload distribution. **Lecturer/Moderator access only.**',
	} as ApiOperationOptions,

	publishTheses: {
		summary: 'Publish theses for student selection',
		description:
			'Publishes a batch of thesis projects making them available for student selection and enrollment. Transitions thesis status to published state, enabling student access for selection process. Validates thesis readiness for publication and checks completion of required information. **Moderator access only.**',
	} as ApiOperationOptions,

	update: {
		summary: 'Update thesis information',
		description:
			'Updates detailed information of a specific thesis project. Allows modification of thesis properties including title, description, domain, required skills, expected outcomes, and requirements. Validates data integrity, checks for title uniqueness, and maintains audit trail of changes. **Lecturer/Moderator access only.**',
	} as ApiOperationOptions,

	submitForReview: {
		summary: 'Submit thesis for review',
		description:
			'Submits a thesis project for administrative review and approval process. Transitions thesis status to review state, triggering evaluation workflow by academic moderators. Validates thesis completeness and checks required information availability. **Lecturer/Moderator access only.**',
	} as ApiOperationOptions,

	reviewThesis: {
		summary: 'Review and approve/reject thesis',
		description:
			'Conducts administrative review of a submitted thesis project with approval or rejection decision. Allows moderators to evaluate thesis proposals, provide feedback, and determine acceptance status. Validates review criteria, processes feedback comments, and updates thesis status accordingly. **Moderator access only.**',
	} as ApiOperationOptions,

	assignThesis: {
		summary: 'Assign thesis to group',
		description:
			'Assigns a thesis project to a specific student group, creating the thesis-group enrollment relationship. Facilitates the thesis allocation process by connecting approved groups with available thesis projects. Validates group eligibility, checks thesis availability, and creates assignment record. **Moderator access only.**',
	} as ApiOperationOptions,

	remove: {
		summary: 'Delete thesis project',
		description:
			'Permanently removes a thesis project from the system. Allows deletion of thesis records including all associated data such as student assignments, supervision relationships, and progress tracking. Validates deletion eligibility, checks for active dependencies, and performs cascade deletion. **Lecturer/Moderator access only.**',
	} as ApiOperationOptions,
};
