import { ApiOperationOptions } from '@nestjs/swagger';

export const ReviewPublicDocs = {
	getSubmissionReviews: {
		summary: 'Get reviews for a submission',
		description: `Retrieves all reviews for a specific submission.\n\n- **Authorization:** Requires authentication (Student, Lecturer, or Moderator role).\n- **Business logic:**\n  - Returns all reviews for the given submission, including lecturer details (with user info), general feedback, review items (with checklistItem), and checklist.\n  - Results are ordered by creation date (newest first).\n- **Response:**\n  - Returns an array of review objects. Each review includes: lecturer (with user), feedback, reviewItems (with checklistItem), checklist, createdAt, etc.\n- **Error handling:**\n  - Returns 404 if the submission does not exist.\n  - Returns error if the database fails.\n- **Logging:** Logs all fetch attempts and errors.`,
	} as ApiOperationOptions,
};
