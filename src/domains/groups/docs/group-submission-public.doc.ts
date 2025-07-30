import { ApiOperationOptions } from '@nestjs/swagger';

export const GroupSubmissionPublicDocs = {
	findGroupSubmissions: {
		summary: 'Get group submissions',
		description: `Retrieve all submissions for a specific group across all milestones, including milestone info, assignment reviews, reviews, and document attachments.\n\n- **Authorization:** Requires authentication.\n- **Business logic:**\n  - Returns all submissions for the group, each with: id, status, documents, createdAt, milestone (id, name, startDate, endDate), assignmentReviews (reviewer info), and reviews (lecturer feedback).\n  - Results are ordered by creation date (newest first).\n  - Results may be cached for performance.\n- **Response:**\n  - Returns an array of submission objects as described above.\n- **Error handling:**\n  - 401 if not authenticated.\n  - 404 if group not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	findSubmissionForMilestone: {
		summary: 'Get submission for specific milestone',
		description: `Get detailed submission information for a specific group and milestone, including milestone info, assignment reviews, reviews, and document attachments.\n\n- **Authorization:** Requires authentication.\n- **Business logic:**\n  - Returns detailed submission info, including: id, status, createdAt, updatedAt, documents, group (id, code, name, semester), milestone (id, name, startDate, endDate), assignmentReviews (reviewer info), reviews (lecturer, checklist, reviewItems), etc.\n- **Response:**\n  - Returns a submission object as described above.\n- **Error handling:**\n  - 401 if not authenticated.\n  - 404 if submission, group, or milestone not found.\n  - 500 on database/cache errors.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,
};
