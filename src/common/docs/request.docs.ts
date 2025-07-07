import { ApiOperationOptions } from '@nestjs/swagger';

export const requestDocs: Record<string, ApiOperationOptions> = {
	createJoinRequest: {
		summary: 'Send a join request to a group',
		description:
			'Allows a student to send a request to join a specific group. The student must be enrolled in the same semester and not already in another group. Group capacity and semester status are validated.',
	},
	createInviteRequest: {
		summary: 'Send invite requests to multiple students',
		description:
			'Allows a group leader to send invitation requests to multiple students to join their group. Only group leaders can send invites. Validates group capacity, student enrollment status, and semester phase.',
	},
	getStudentRequests: {
		summary: 'Get all requests for current student',
		description:
			'Retrieves all requests (both sent and received) for the authenticated student. Includes join requests sent by the student and invite requests received from groups.',
	},
	getGroupRequests: {
		summary: 'Get all requests for a specific group',
		description:
			'Retrieves all requests related to a specific group. Only accessible by the group leader. Includes both join requests from students and invite requests sent by the group.',
	},
	updateRequestStatus: {
		summary: 'Update request status (approve/reject/cancel)',
		description:
			'Updates the status of a request. For join requests: group leaders can approve/reject, students can cancel their own requests. For invite requests: invited students can approve/reject, group leaders can cancel their own invites. Approved requests automatically add the student to the group.',
	},
	cancelRequest: {
		summary: 'Cancel a pending request (legacy endpoint)',
		description:
			'Allows a student to cancel their own pending request. Only the student who originally sent the request can cancel it. Only pending requests can be cancelled. Note: This is a legacy endpoint - you can also use PUT /:requestId/status with status "cancelled".',
	},
	findOne: {
		summary: 'Get details of a specific request',
		description:
			'Retrieves detailed information about a specific request by ID. Only accessible by the student who sent the request or the group leader of the target group.',
	},
};
