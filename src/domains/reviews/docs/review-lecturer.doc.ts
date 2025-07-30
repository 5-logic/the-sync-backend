import { ApiOperationOptions } from '@nestjs/swagger';

export const ReviewLecturerDocs = {
	getAssignedReviews: {
		summary: 'Get assigned reviews for lecturer',
		description: `Retrieves all submissions assigned to the current lecturer for review.\n\n- **Authorization:** Lecturer or Moderator role required.\n- **Business logic:**\n  - Returns group and milestone details for each assigned review.\n  - Uses cache-aside pattern for performance (5 min TTL).\n- **Error handling:**\n  - Returns error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	getReviewForm: {
		summary: 'Get review form for submission',
		description: `Retrieves the review form for a submission, including milestone checklist and checklist items.\n\n- **Authorization:** Lecturer or Moderator role required.\n- **Business logic:**\n  - Returns the review form structure for conducting the review.\n  - Uses cache-aside pattern for performance (15 min TTL).\n- **Error handling:**\n  - Returns 404 if submission not found.\n  - Returns error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	} as ApiOperationOptions,

	submitReview: {
		summary: 'Submit review for submission',
		description: `Submits a review for a submission.\n\n- **Authorization:** Lecturer or Moderator role required; must be assigned as reviewer.\n- **Validations:**\n  - Lecturer must be assigned to the submission (checked via assignmentReview).\n  - Prevents duplicate reviews for the same submission and checklist (only one review per lecturer per submission per checklist).\n  - Only the secondary reviewer (isMainReviewer = false) is allowed to submit detailed review items. The main reviewer can only submit general feedback.\n  - If the main reviewer submits review items, a 403 Forbidden error will be returned.\n- **Business logic:**\n  - Creates the review and review items (if any) in a transaction.\n  - Sends email notifications to group members when the review is completed.\n  - Returns the created review data, including lecturer info, reviewItems, and checklistItem.\n- **Error handling:**\n  - 404 if not assigned or already reviewed.\n  - 403 if the main reviewer submits review items.\n  - Returns error if database or cache fails.\n- **Response:**\n  - Returns the created review object, including: lecturer (with user), reviewItems (with checklistItem), feedback, checklistId, submissionId, ...\n- **Logging:** Logs all submission attempts, notifications, and errors.`,
	} as ApiOperationOptions,

	updateReview: {
		summary: 'Update an existing review',
		description: `Updates an existing review for a submission.\n\n- **Authorization:** Lecturer or Moderator role required; must be the assigned reviewer for this submission.\n- **Validations:**\n  - Only the assigned reviewer (assignmentReview) can update the review.\n  - The review must exist.\n- **Business logic:**\n  - Allows updating feedback and reviewItems (upsert each reviewItem by checklistItemId).\n  - All operations are performed in a transaction.\n  - Returns the updated review data, including lecturer (with user), reviewItems (with checklistItem).\n  - (Optionally) sends email notifications when the review is updated.\n- **Error handling:**\n  - 404 if the review does not exist or the user is not assigned.\n  - Returns error if the database fails.\n- **Response:**\n  - Returns the updated review object, including: lecturer (with user), reviewItems (with checklistItem), feedback, checklistId, submissionId, ...\n- **Logging:** Logs all update attempts, notifications, and errors.`,
	} as ApiOperationOptions,
};
