export const ReviewDocs = {
	findAll: {
		summary: 'Get submissions for review',
		description:
			'Fetches submissions available for review assignment with optional filtering. Supports filtering by semester, milestone, or both. Includes group information, milestone data, assigned reviewers count, and completed reviews count. **Moderator access only.**',
	},
	getEligibleReviewers: {
		summary: 'Get eligible reviewers for submission',
		description:
			'Lists lecturers eligible to review a specific submission. Excludes already assigned reviewers. Includes lecturer details like name, email, and moderator status. **Accessible by Moderator role only.**',
	},
	create: {
		summary: 'Assign bulk reviewers to submissions',
		description:
			'Assigns multiple lecturers as reviewers for multiple submissions in bulk. Validates lecturer eligibility and prevents duplicate assignments. Sends email notifications to assigned reviewers. **Accessible by Moderator role only.**',
	},
	update: {
		summary: 'Update reviewer assignment for submission',
		description:
			'Updates reviewer assignments for a specific submission. Allows adding or removing reviewers. Sends email notifications to newly assigned reviewers. **Accessible by Moderator role only.**',
	},
	getAssignedReviews: {
		summary: 'Get assigned reviews for lecturer',
		description:
			'Retrieves all submissions assigned to the current lecturer for review. Includes group and milestone details. **Lecturer and Moderator access.**',
	},
	findOne: {
		summary: 'Get review form for submission',
		description:
			'Retrieves the review form for a submission, including milestone checklist and checklist items. Provides the framework for conducting the review. **Lecturer and Moderator access.**',
	},
	submitReview: {
		summary: 'Submit review for submission',
		description:
			'Submits a review for a submission. Includes general feedback and individual review items for each checklist item. Validates lecturer assignment and prevents duplicate submissions. Sends email notification when review is completed. **Lecturer access only.**',
	},
	findBySubmission: {
		summary: 'Get reviews for submission',
		description:
			'Retrieves all reviews for a submission within a group. Includes lecturer details, general feedback, and individual review items. **Student access only.**',
	},
};
