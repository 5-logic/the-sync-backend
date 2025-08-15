import { ApiOperationOptions } from '@nestjs/swagger';

export const RequestStudentDocs = {
	createJoinRequest: {
		summary: 'Join a group (auto-join or send request)',
		description: `Allows a student to join a group with smart logic based on group status.\n\n- **Authorization:** Student role required.\n- **Smart Logic:**\n  - **Empty Group:** Student automatically joins as leader (no request needed).\n  - **Group with Members:** Creates join request for leader approval.\n- **Validations:**\n  - Student must be enrolled in the same semester as the group.\n  - Student must not already be in another group for the semester.\n  - Group must exist and not be full (max 5 members).\n  - Semester must be in 'Preparing' status.\n  - For non-empty groups: No existing pending join request for the student.\n- **Business Logic:**\n  - **Auto-Join (Empty Group):**\n    - Directly adds student to group as leader.\n    - Creates StudentGroupParticipation record with isLeader=true.\n    - Returns participation details with type 'auto_join'.\n  - **Request Creation (Non-Empty Group):**\n    - Creates join request with status 'Pending'.\n    - Sends email notification to group leader.\n    - Returns request details with type 'request_sent'.\n- **Response Formats:**\n  - **Auto-Join:** { message, participation, type: 'auto_join' }\n  - **Request:** { message, request, type: 'request_sent' }\n- **Error Cases:**\n  - Group or semester not found.\n  - Student not enrolled or already in a group.\n  - Group is full.\n  - Pending join request exists (for non-empty groups).\n  - Semester not in 'Preparing' status.\n- **Logging:** All attempts, auto-joins, and errors are logged with detailed context.`,
	} as ApiOperationOptions,
	createInviteRequest: {
		summary: 'Send invite requests to multiple students',
		description: `Allows a group leader to send invitation requests to multiple students to join their group.\n\n- **Authorization:** Student role required; must be group leader.\n- **Validations:**\n  - Group must exist and not be full after invites.\n  - Semester must be in 'Preparing' status.\n  - Each invited student must be enrolled in the semester and not already in a group.\n  - No existing pending invite request for each student.\n- **Business logic:**\n  - Creates invite requests for each student with status 'Pending'.\n  - Sends email notifications to invited students.\n  - Clears relevant caches for group and invited students.\n- **Error cases:**\n  - Group or semester not found.\n  - Not group leader.\n  - Group would exceed capacity.\n  - Student not enrolled or already in a group.\n  - Pending invite request exists.\n- **Logging:** All attempts and errors are logged.`,
	} as ApiOperationOptions,
	getStudentRequests: {
		summary: 'Get all requests for current student',
		description: `Retrieves all requests (both sent and received) for the authenticated student.\n\n- **Authorization:** Student role required.\n- **Business logic:**\n  - Returns all requests where the student is the requester or recipient.\n  - Includes join and invite requests.\n  - No caching to ensure real-time updates.\n- **Error cases:**\n  - Database errors.\n- **Logging:** All fetch attempts and errors are logged.`,
	} as ApiOperationOptions,
	getGroupRequests: {
		summary: 'Get all requests for a specific group',
		description: `Retrieves all requests related to a specific group.\n\n- **Authorization:** Student role required; must be group leader.\n- **Business logic:**\n  - Returns all join and invite requests for the group.\n  - No caching to ensure real-time updates.\n- **Error cases:**\n  - Not group leader.\n  - Group not found.\n  - Database errors.\n- **Logging:** All fetch attempts and errors are logged.`,
	} as ApiOperationOptions,
	updateRequestStatus: {
		summary: 'Update request status (approve/reject/cancel)',
		description: `Updates the status of a request.\n\n- **Authorization:** Student role required.\n- **Validations:**\n  - For join requests: group leader can approve/reject, student can cancel.\n  - For invite requests: invited student can approve/reject, group leader can cancel.\n  - Only pending requests can be updated.\n- **Business logic:**\n  - Approving a request adds the student to the group and rejects all other pending requests for the student.\n  - Sends email notification about status update.\n  - Clears relevant caches.\n- **Error cases:**\n  - Request not found.\n  - Not authorized to update request.\n  - Request not pending.\n  - Group is full or student already in a group (on approval).\n- **Logging:** All update attempts and errors are logged.`,
	} as ApiOperationOptions,
	cancelRequest: {
		summary: 'Cancel a pending request (legacy endpoint)',
		description: `Allows a student to cancel their own pending request.\n\n- **Authorization:** Student role required; only the student who sent the request can cancel.\n- **Validations:**\n  - Only pending requests can be cancelled.\n- **Business logic:**\n  - Updates request status to 'Cancelled'.\n  - Clears relevant caches.\n- **Error cases:**\n  - Request not found.\n  - Not the original requester.\n  - Request not pending.\n- **Note:** This is a legacy endpoint; preferred to use PUT /:requestId/status with status 'cancelled'.\n- **Logging:** All cancel attempts and errors are logged.`,
	} as ApiOperationOptions,
	findOne: {
		summary: 'Get details of a specific request',
		description: `Retrieves detailed information about a specific request by ID.\n\n- **Authorization:** Student role required; only the student who sent the request or the group leader of the target group can access.\n- **Business logic:**\n  - Returns request details including student, group, and semester info.\n  - Uses cache-aside pattern for performance (5 min TTL).\n- **Error cases:**\n  - Request not found.\n  - Not authorized to view request.\n- **Logging:** All fetch attempts and errors are logged.`,
	} as ApiOperationOptions,
};
