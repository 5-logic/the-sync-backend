export enum EmailJobType {
	// Authentication
	SEND_OTP = 'send-otp',
	SEND_RESET_PASSWORD = 'send-reset-password',

	// Accounts
	SEND_LECTURER_ACCOUNT = 'send-lecturer-account',
	SEND_STUDENT_ACCOUNT = 'send-student-account',

	// Semesters
	SEND_SEMESTER_ONGOING_NOTIFICATION = 'send-semester-ongoing-notification',

	// Groups
	SEND_GROUP_DELETION_NOTIFICATION = 'send-group-deletion-notification',
	SEND_GROUP_LEADER_CHANGE_NOTIFICATION = 'send-group-leader-change-notification',
	SEND_GROUP_MEMBER_CHANGE_NOTIFICATION = 'send-group-member-change-notification',

	// Theses
	SEND_THESIS_ASSIGNMENT_NOTIFICATION = 'send-thesis-assignment-notification',
	SEND_THESIS_STATUS_CHANGE = 'send-thesis-status-change',

	// Enrollment
	SEND_ENROLLMENT_RESULT_NOTIFICATION = 'send-enrollment-result-notification',

	// Invitations / Requests in Groups
	SEND_INVITE_REQUEST_NOTIFICATION = 'send-invite-request-notification',
	SEND_JOIN_REQUEST_NOTIFICATION = 'send-join-request-notification',
	SEND_REQUEST_STATUS_UPDATE = 'send-request-status-update',

	// Supevisions
	SEND_SUPERVISION_NOTIFICATION = 'send-supervision-notification',

	// Reviews in Submissions
	SEND_REVIEWER_ASSIGNMENT_NOTIFICATION = 'send-reviewer-assignment-notification',
	SEND_REVIEW_COMPLETED_NOTIFICATION = 'send-review-completed-notification',
}
