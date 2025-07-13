export const ReviewDocs = {
	findAll: {
		summary: 'Get submissions for review',
		description: `Fetches submissions available for review assignment with optional filtering.\n\n- **Authorization:** Moderator role required.\n- **Business logic:**\n  - Supports filtering by semester, milestone, or both.\n  - Returns group info, milestone data, assigned reviewers count, and completed reviews count.\n  - Uses cache-aside pattern for performance.\n- **Error handling:**\n  - Returns error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	},
	getEligibleReviewers: {
		summary: 'Get eligible reviewers for submission',
		description: `Lists lecturers eligible to review a specific submission.\n\n- **Authorization:** Moderator role required.\n- **Business logic:**\n  - Excludes already assigned reviewers.\n  - Returns lecturer details (name, email, moderator status).\n  - Uses cache-aside pattern for performance (10 min TTL).\n- **Error handling:**\n  - Returns 404 if submission not found.\n  - Returns error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	},
	create: {
		summary: 'Assign bulk reviewers to submissions',
		description: `Assigns multiple lecturers as reviewers for multiple submissions in bulk.\n\n- **Authorization:** Moderator role required.\n- **Validations:**\n  - All submissions and lecturers must exist.\n  - Prevents duplicate assignments.\n- **Business logic:**\n  - Assigns reviewers in bulk and sends email notifications.\n  - Clears relevant caches after assignment.\n- **Error handling:**\n  - Returns 404 if any submission or lecturer not found.\n  - Returns error if database or cache fails.\n- **Logging:** Logs all assignment attempts, notifications, and errors.`,
	},
	update: {
		summary: 'Update reviewer assignment for submission',
		description: `Updates reviewer assignments for a specific submission.\n\n- **Authorization:** Moderator role required.\n- **Validations:**\n  - Submission and all lecturers must exist.\n- **Business logic:**\n  - Removes old assignments and creates new ones.\n  - Sends email notifications to newly assigned reviewers.\n  - Clears relevant caches after update.\n- **Error handling:**\n  - Returns 404 if submission or lecturer not found.\n  - Returns error if database or cache fails.\n- **Logging:** Logs all update attempts, notifications, and errors.`,
	},
	getAssignedReviews: {
		summary: 'Get assigned reviews for lecturer',
		description: `Retrieves all submissions assigned to the current lecturer for review.\n\n- **Authorization:** Lecturer or Moderator role required.\n- **Business logic:**\n  - Returns group and milestone details for each assigned review.\n  - Uses cache-aside pattern for performance (5 min TTL).\n- **Error handling:**\n  - Returns error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	},
	findOne: {
		summary: 'Get review form for submission',
		description: `Retrieves the review form for a submission, including milestone checklist and checklist items.\n\n- **Authorization:** Lecturer or Moderator role required.\n- **Business logic:**\n  - Returns the review form structure for conducting the review.\n  - Uses cache-aside pattern for performance (15 min TTL).\n- **Error handling:**\n  - Returns 404 if submission not found.\n  - Returns error if database or cache fails.\n- **Logging:** Logs all fetch attempts, cache hits, and errors.`,
	},
	submitReview: {
		summary: 'Submit review for submission',
		description: `Submits a review for a submission.\n\n- **Authorization:** Lecturer role required; must be assigned as reviewer.\n- **Validations:**\n  - Lecturer must be assigned to the submission.\n  - Prevents duplicate reviews for the same submission and checklist.\n- **Business logic:**\n  - Creates review and review items in a transaction.\n  - Sends email notification to group members when review is completed.\n  - Clears relevant caches after submission.\n- **Error handling:**\n  - Returns 404 if not assigned or already reviewed.\n  - Returns error if database or cache fails.\n- **Logging:** Logs all submission attempts, notifications, and errors.`,
	},
	findBySubmission: {
		summary: 'Get reviews for submission',
		description: `Retrieves all reviews for a submission within a group.\n\n- **Authorization:** Student, Lecturer, or Moderator role required.\n- **Business logic:**\n  - Returns lecturer details, general feedback, and individual review items.\n  - Results ordered by creation date (newest first).\n- **Error handling:**\n  - Returns 404 if submission not found or does not belong to group.\n  - Returns error if database fails.\n- **Logging:** Logs all fetch attempts and errors.`,
	},
};
