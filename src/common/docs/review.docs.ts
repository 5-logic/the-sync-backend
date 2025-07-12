export const ReviewDocs = {
	findAll: {
		summary: 'Get all submissions for review',
		description:
			'Fetches all submissions available for review assignment. Includes group information, milestone data, assigned reviewers count, and completed reviews count. **Moderator access only.**',
	},
	getEligibleReviewers: {
		summary: 'Get eligible reviewers for submission',
		description:
			'Lists lecturers eligible to review a specific submission. Excludes already assigned reviewers. Includes lecturer details like name, email, and moderator status. **Moderator access only.**',
	},
	create: {
		summary: 'Assign reviewer to submission',
		description:
			'Assigns one or more lecturers as reviewers for a submission. Validates lecturer eligibility and prevents duplicate assignments. **Moderator access only.**',
	},
	remove: {
		summary: 'Unassign reviewers from submission',
		description:
			'Removes all reviewer assignments from a submission, making it available for new assignments. **Moderator access only.**',
	},
	getAssignedReviews: {
		summary: 'Get assigned reviews for lecturer',
		description:
			'Retrieves all submissions assigned to a lecturer for review. Includes group and milestone details. **Lecturer access only.**',
	},
	findOne: {
		summary: 'Get review form for submission',
		description:
			'Retrieves the review form for a submission, including milestone checklist and checklist items. Provides the framework for conducting the review. **Lecturer access only.**',
	},
	submitReview: {
		summary: 'Submit review for submission',
		description:
			'Submits a review for a submission. Includes general feedback and individual review items for each checklist item. Validates lecturer assignment and prevents duplicate submissions. **Lecturer access only.**',
	},
	update: {
		summary: 'Update existing review',
		description:
			'Updates an existing review, including general feedback and individual review items. Validates lecturer ownership of the review. **Lecturer access only.**',
	},
	findBySubmission: {
		summary: 'Get reviews for submission',
		description:
			'Retrieves all reviews for a submission within a group. Includes lecturer details, general feedback, and individual review items. **Student and Moderator access.**',
	},
};
