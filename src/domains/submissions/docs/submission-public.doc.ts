import { ApiOperationOptions } from '@nestjs/swagger';

export const SubmissionPublicDocs = {
	findAll: {
		summary: 'Get all submissions',
		description: `Retrieve all submissions across all groups and milestones, including group info, milestone details, document attachments, assignment reviews, and lecturer feedback.\n\n- **Authorization:** Requires authentication.\n- **Business logic:**\n  - Returns all submissions with group, milestone, assignmentReviews (with reviewer info), and reviews (with lecturer feedback).\n  - Results are ordered by creation date (newest first).\n  - Results may be cached for performance.\n- **Response:**\n  - Returns an array of submission objects. Each includes: id, status, documents, createdAt, group (id, code, name, semester), milestone (id, name, startDate, endDate), assignmentReviews (reviewer info), reviews (lecturer feedback).\n- **Error handling:**\n  - 401 if not authenticated.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findDetail: {
		summary: 'Get submission detail by ID',
		description: `Get detailed information for a submission by its ID, including group, milestone, document attachments, assignment reviews, reviews, thesis, and supervisors.\n\n- **Authorization:** Requires authentication.\n- **Business logic:**\n  - Returns all details of the submission, including: id, status, createdAt, updatedAt, documents, group (with semester, thesis, supervisors), assignmentReviews (reviewer info), reviewers, and reviews.\n- **Response:**\n  - Returns an object with: submission (basic info), group (with thesis and supervisors), reviewers (array).\n- **Error handling:**\n  - 401 if not authenticated.\n  - 404 if submission not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findAllBySemester: {
		summary: 'Get submissions for review by semester',
		description: `Retrieve all submissions for a specific semester, including group, milestone, thesis, supervisors, and review lecturers.\n\n- **Authorization:** Requires authentication.\n- **Business logic:**\n  - Returns submissions for review, each with: id, status, documents, createdAt, group (id, name, code), milestone (id, name), thesis (with supervisors), and reviewLecturers (reviewer info).\n  - Results are ordered by creation date (newest first).\n  - Results may be cached for performance.\n- **Response:**\n  - Returns an array of submission objects as described above.\n- **Error handling:**\n  - 401 if not authenticated.\n  - 404 if semester not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findAllByMilestone: {
		summary: 'Get submissions for review by milestone',
		description: `Retrieve all submissions for a specific milestone, including group, milestone, thesis, supervisors, and review lecturers.\n\n- **Authorization:** Requires authentication.\n- **Business logic:**\n  - Returns submissions for review, each with: id, status, documents, createdAt, group (id, name, code), milestone (id, name), thesis (with supervisors), and reviewLecturers (reviewer info).\n  - Results are ordered by creation date (newest first).\n  - Results may be cached for performance.\n- **Response:**\n  - Returns an array of submission objects as described above.\n- **Error handling:**\n  - 401 if not authenticated.\n  - 404 if milestone not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findAllBySemesterAndMilestone: {
		summary: 'Get submissions for review by semester and milestone',
		description: `Retrieve all submissions for a specific semester and milestone, including group, milestone, thesis, supervisors, and review lecturers.\n\n- **Authorization:** Requires authentication.\n- **Business logic:**\n  - Returns submissions for review, each with: id, status, documents, createdAt, group (id, name, code), milestone (id, name), thesis (with supervisors), and reviewLecturers (reviewer info).\n  - Results are ordered by creation date (newest first).\n  - Results may be cached for performance.\n- **Response:**\n  - Returns an array of submission objects as described above.\n- **Error handling:**\n  - 401 if not authenticated.\n  - 404 if semester or milestone not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findByGroupId: {
		summary: 'Get group submissions',
		description: `Retrieve all submissions for a specific group across all milestones, including document attachments.\n\n- **Authorization:** Group members, Admin, and Lecturer.\n- **Business logic:**\n  - Returns submission history with milestone info, document files, and review details.\n  - Results are cached for performance.\n- **Error handling:**\n  - 403 if not a group member.\n  - 404 if group not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findOne: {
		summary: 'Get submission for specific milestone',
		description: `Get detailed submission information for a specific group and milestone, including all document attachments.\n\n- **Authorization:** Group members, Admin, and Lecturer.\n- **Business logic:**\n  - Returns group details, milestone info, document files, assignment reviews, and lecturer feedback.\n  - Includes checklist reviews and evaluation details.\n- **Error handling:**\n  - 403 if not a group member.\n  - 404 if submission, group, or milestone not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,
};
