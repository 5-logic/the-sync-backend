import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import {
	CreateInviteRequestDto,
	CreateJoinRequestDto,
	UpdateRequestStatusDto,
} from '@/requests/dto';

import {
	EnrollmentStatus,
	RequestStatus,
	RequestType,
	SemesterStatus,
} from '~/generated/prisma';

@Injectable()
export class RequestService {
	private readonly logger = new Logger(RequestService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly emailQueueService: EmailQueueService,
	) {}

	// Validation methods
	private async validateStudentEnrollment(userId: string, semesterId: string) {
		const enrollment = await this.prisma.enrollment.findUnique({
			where: {
				studentId_semesterId: {
					studentId: userId,
					semesterId: semesterId,
				},
			},
		});

		if (!enrollment) {
			throw new NotFoundException(`Student is not enrolled in this semester`);
		}

		if (enrollment.status !== EnrollmentStatus.NotYet) {
			throw new ConflictException(
				`Student enrollment status must be 'NotYet' to join/invite groups`,
			);
		}
	}

	private async validateSemesterStatus(semesterId: string) {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});

		if (!semester) {
			throw new NotFoundException(`Semester not found`);
		}

		if (semester.status !== SemesterStatus.Preparing) {
			throw new ConflictException(
				`Cannot send/process requests. Semester status must be ${SemesterStatus.Preparing}, current status is ${semester.status}`,
			);
		}

		return semester;
	}

	private async validateStudentIsGroupLeader(userId: string, groupId: string) {
		const participation = await this.prisma.studentGroupParticipation.findFirst(
			{
				where: {
					studentId: userId,
					groupId: groupId,
				},
			},
		);

		if (!participation) {
			throw new ForbiddenException(`Student is not a member of this group`);
		}

		if (!participation.isLeader) {
			throw new ForbiddenException(
				`Only group leader can manage group requests`,
			);
		}

		return participation;
	}

	private async validateGroupCapacity(groupId: string) {
		const memberCount = await this.prisma.studentGroupParticipation.count({
			where: { groupId: groupId },
		});

		if (memberCount >= 5) {
			throw new ConflictException(
				`Group is full. Maximum 5 members allowed, current: ${memberCount}`,
			);
		}

		return memberCount;
	}

	private async validateStudentNotInGroup(userId: string, semesterId: string) {
		const existingParticipation =
			await this.prisma.studentGroupParticipation.findFirst({
				where: {
					studentId: userId,
					semesterId: semesterId,
				},
			});

		if (existingParticipation) {
			throw new ConflictException(
				`Student is already a member of a group in this semester`,
			);
		}
	}

	private async validateNoPendingJoinRequest(userId: string) {
		const pendingRequest = await this.prisma.request.findFirst({
			where: {
				studentId: userId,
				type: RequestType.Join,
				status: RequestStatus.Pending,
			},
		});

		if (pendingRequest) {
			throw new ConflictException(
				`Student already has a pending join request. Cancel it before sending a new one`,
			);
		}
	}

	private async validateNoPendingInviteRequest(
		studentId: string,
		groupId: string,
	) {
		const pendingRequest = await this.prisma.request.findFirst({
			where: {
				studentId: studentId,
				groupId: groupId,
				type: RequestType.Invite,
				status: RequestStatus.Pending,
			},
		});

		if (pendingRequest) {
			throw new ConflictException(
				`There is already a pending invite request for this student`,
			);
		}
	}

	// API Methods

	/**
	 * Student sends a request to join a group
	 */
	async createJoinRequest(
		userId: string,
		dto: CreateJoinRequestDto,
	): Promise<any> {
		try {
			// Get group and validate
			const group = await this.prisma.group.findUnique({
				where: { id: dto.groupId },
				include: { semester: true },
			});

			if (!group) {
				throw new NotFoundException(`Group not found`);
			}

			// Validate semester status
			await this.validateSemesterStatus(group.semesterId);

			// Validate student enrollment
			await this.validateStudentEnrollment(userId, group.semesterId);

			// Validate student is not already in a group
			await this.validateStudentNotInGroup(userId, group.semesterId);

			// Validate no pending join request
			await this.validateNoPendingJoinRequest(userId);

			// Validate group capacity
			await this.validateGroupCapacity(dto.groupId);

			// Create join request
			const request = await this.prisma.request.create({
				data: {
					type: RequestType.Join,
					status: RequestStatus.Pending,
					studentId: userId,
					groupId: dto.groupId,
				},
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
					group: {
						select: {
							id: true,
							code: true,
							name: true,
						},
					},
				},
			});

			this.logger.log(
				`Student ${userId} sent join request to group ${group.code}`,
			);

			// Send email notification to group leader
			const groupLeader = await this.prisma.studentGroupParticipation.findFirst(
				{
					where: {
						groupId: dto.groupId,
						isLeader: true,
					},
					include: {
						student: {
							include: {
								user: true,
							},
						},
					},
				},
			);

			await this.sendJoinRequestNotification(request, group, groupLeader);

			return request;
		} catch (error) {
			this.logger.error('Error creating join request', error);
			throw error;
		}
	}

	/**
	 * Group leader sends invites to multiple students
	 */
	async createInviteRequest(
		userId: string,
		groupId: string,
		dto: CreateInviteRequestDto,
	) {
		try {
			// Get group and validate
			const group = await this.prisma.group.findUnique({
				where: { id: groupId },
				include: { semester: true },
			});

			if (!group) {
				throw new NotFoundException(`Group not found`);
			}

			// Validate semester status
			await this.validateSemesterStatus(group.semesterId);

			// Validate user is group leader
			await this.validateStudentIsGroupLeader(userId, groupId);

			// Get current group member count
			const currentMemberCount =
				await this.prisma.studentGroupParticipation.count({
					where: { groupId: groupId },
				});

			// Check if inviting all students would exceed group capacity
			if (currentMemberCount + dto.studentIds.length > 5) {
				throw new ConflictException(
					`Cannot invite ${dto.studentIds.length} students. Group capacity would be exceeded. Current members: ${currentMemberCount}, Maximum: 5`,
				);
			}

			// Validate each student before creating requests
			for (const studentId of dto.studentIds) {
				// Validate target student enrollment
				await this.validateStudentEnrollment(studentId, group.semesterId);

				// Validate target student is not already in a group
				await this.validateStudentNotInGroup(studentId, group.semesterId);

				// Validate no pending invite request for this student from this group
				await this.validateNoPendingInviteRequest(studentId, groupId);
			}

			// Create all invite requests in a transaction
			const requests = await this.prisma.$transaction(async (prisma) => {
				const createdRequests: any[] = [];
				for (const studentId of dto.studentIds) {
					const request = await prisma.request.create({
						data: {
							type: RequestType.Invite,
							status: RequestStatus.Pending,
							studentId: studentId,
							groupId: groupId,
						},
						include: {
							student: {
								include: {
									user: {
										select: {
											id: true,
											fullName: true,
											email: true,
										},
									},
								},
							},
							group: {
								select: {
									id: true,
									code: true,
									name: true,
								},
							},
						},
					});
					createdRequests.push(request);
				}
				return createdRequests;
			});

			this.logger.log(
				`Group ${group.code} sent invite requests to ${dto.studentIds.length} students: ${dto.studentIds.join(', ')}`,
			);

			// Get group leader info for email notifications
			const groupLeader = await this.prisma.studentGroupParticipation.findFirst(
				{
					where: {
						groupId: groupId,
						isLeader: true,
					},
					include: {
						student: {
							include: {
								user: true,
							},
						},
					},
				},
			);

			// Send email notifications to all invited students
			await Promise.allSettled(
				requests.map((request) =>
					this.sendInviteRequestNotification(request, group, groupLeader),
				),
			);

			return requests;
		} catch (error) {
			this.logger.error('Error creating invite requests', error);
			throw error;
		}
	}

	/**
	 * Get all requests for a student (both sent and received)
	 */
	async getStudentRequests(userId: string) {
		try {
			const requests = await this.prisma.request.findMany({
				where: {
					studentId: userId,
				},
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
					group: {
						select: {
							id: true,
							code: true,
							name: true,
							semester: {
								select: {
									id: true,
									name: true,
									code: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(
				`Found ${requests.length} requests for student ${userId}`,
			);
			return requests;
		} catch (error) {
			this.logger.error('Error fetching student requests', error);
			throw error;
		}
	}

	/**
	 * Get all requests for a group (only accessible by group leader)
	 */
	async getGroupRequests(userId: string, groupId: string) {
		try {
			// Validate user is group leader
			await this.validateStudentIsGroupLeader(userId, groupId);

			const requests = await this.prisma.request.findMany({
				where: {
					groupId: groupId,
				},
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
					group: {
						select: {
							id: true,
							code: true,
							name: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${requests.length} requests for group ${groupId}`);
			return requests;
		} catch (error) {
			this.logger.error('Error fetching group requests', error);
			throw error;
		}
	}

	/**
	 * Process a request (approve/reject) - can be done by student or group leader
	 */
	async updateRequestStatus(
		userId: string,
		requestId: string,
		dto: UpdateRequestStatusDto,
	) {
		try {
			// Get request with full details
			const request = await this.prisma.request.findUnique({
				where: { id: requestId },
				include: {
					student: true,
					group: {
						include: {
							semester: true,
						},
					},
				},
			});

			if (!request) {
				throw new NotFoundException(`Request not found`);
			}

			if (request.status !== RequestStatus.Pending) {
				throw new ConflictException(
					`Request has already been ${request.status.toLowerCase()}`,
				);
			}

			// Validate permissions based on request type
			if (request.type === RequestType.Join) {
				// For join requests, only group leader can approve/reject
				await this.validateStudentIsGroupLeader(userId, request.groupId);
			} else if (request.type === RequestType.Invite) {
				// For invite requests, only the invited student can approve/reject
				if (userId !== request.studentId) {
					throw new ForbiddenException(
						`Only the invited student can respond to this invitation`,
					);
				}
			}

			// If approving, perform additional validations
			if (dto.status === RequestStatus.Approved) {
				// Validate semester status
				await this.validateSemesterStatus(request.group.semesterId);

				// Validate student is not already in a group
				await this.validateStudentNotInGroup(
					request.studentId,
					request.group.semesterId,
				);

				// Validate group capacity
				await this.validateGroupCapacity(request.groupId);
			}

			// Update request and potentially add student to group
			const result = await this.prisma.$transaction(async (prisma) => {
				// Update request status
				const updatedRequest = await prisma.request.update({
					where: { id: requestId },
					data: { status: dto.status },
					include: {
						student: {
							include: {
								user: {
									select: {
										id: true,
										fullName: true,
										email: true,
									},
								},
							},
						},
						group: {
							select: {
								id: true,
								code: true,
								name: true,
							},
						},
					},
				});

				// If approved, add student to group
				if (dto.status === RequestStatus.Approved) {
					await prisma.studentGroupParticipation.create({
						data: {
							studentId: request.studentId,
							groupId: request.groupId,
							semesterId: request.group.semesterId,
							isLeader: false,
						},
					});

					// Cancel all other pending requests for this student
					await prisma.request.updateMany({
						where: {
							studentId: request.studentId,
							status: RequestStatus.Pending,
							id: { not: requestId },
						},
						data: { status: RequestStatus.Rejected },
					});
				}

				return updatedRequest;
			});

			this.logger.log(
				`Request ${requestId} ${dto.status.toLowerCase()} by user ${userId}`,
			);

			// Send email notification about request status update
			await this.sendRequestStatusUpdateNotification(requestId, dto.status);

			return result;
		} catch (error) {
			this.logger.error('Error updating request status', error);
			throw error;
		}
	}

	/**
	 * Cancel a pending request (only by the student who sent it)
	 */
	async cancelRequest(userId: string, requestId: string) {
		try {
			const request = await this.prisma.request.findUnique({
				where: { id: requestId },
			});

			if (!request) {
				throw new NotFoundException(`Request not found`);
			}

			if (request.studentId !== userId) {
				throw new ForbiddenException(
					`Only the student who sent the request can cancel it`,
				);
			}

			if (request.status !== RequestStatus.Pending) {
				throw new ConflictException(
					`Cannot cancel a request that is not pending`,
				);
			}

			const cancelledRequest = await this.prisma.request.update({
				where: { id: requestId },
				data: { status: RequestStatus.Rejected },
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
					group: {
						select: {
							id: true,
							code: true,
							name: true,
						},
					},
				},
			});

			this.logger.log(`Request ${requestId} cancelled by student ${userId}`);
			return cancelledRequest;
		} catch (error) {
			this.logger.error('Error cancelling request', error);
			throw error;
		}
	}

	/**
	 * Get a specific request by ID
	 */
	async findOne(userId: string, requestId: string) {
		try {
			const request = await this.prisma.request.findUnique({
				where: { id: requestId },
				include: {
					student: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
					group: {
						select: {
							id: true,
							code: true,
							name: true,
							semester: {
								select: {
									id: true,
									name: true,
									code: true,
								},
							},
						},
					},
				},
			});

			if (!request) {
				throw new NotFoundException(`Request not found`);
			}

			// Check permissions
			const isStudent = request.studentId === userId;
			const isGroupLeader = await this.prisma.studentGroupParticipation
				.findFirst({
					where: {
						studentId: userId,
						groupId: request.groupId,
						isLeader: true,
					},
				})
				.then((participation) => !!participation);

			if (!isStudent && !isGroupLeader) {
				throw new ForbiddenException(
					`You don't have permission to view this request`,
				);
			}

			return request;
		} catch (error) {
			this.logger.error('Error fetching request', error);
			throw error;
		}
	}

	// Email notification helpers
	private async sendJoinRequestNotification(
		request: any,
		group: any,
		groupLeader: any,
	) {
		try {
			if (groupLeader?.student.user.email) {
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_JOIN_REQUEST_NOTIFICATION,
					{
						to: groupLeader.student.user.email,
						subject: `New Join Request for Group ${group.code}`,
						context: {
							leaderName: groupLeader.student.user.fullName,
							studentName: request.student.user.fullName,
							studentEmail: request.student.user.email,
							groupName: group.name,
							groupCode: group.code,
							semesterName: group.semester.name,
							requestDate: new Date().toLocaleDateString(),
						},
					},
				);
			}
		} catch (emailError) {
			this.logger.warn(
				'Failed to send join request notification email',
				emailError,
			);
		}
	}

	private async sendInviteRequestNotification(
		request: any,
		group: any,
		groupLeader: any,
	) {
		try {
			if (request.student.user.email) {
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_INVITE_REQUEST_NOTIFICATION,
					{
						to: request.student.user.email,
						subject: `Group Invitation from ${group.code}`,
						context: {
							studentName: request.student.user.fullName,
							groupName: group.name,
							groupCode: group.code,
							leaderName: groupLeader?.student.user.fullName ?? 'Group Leader',
							leaderEmail: groupLeader?.student.user.email ?? '',
							semesterName: group.semester.name,
							requestDate: new Date().toLocaleDateString(),
						},
					},
				);
			}
		} catch (emailError) {
			this.logger.warn(
				'Failed to send invite request notification email',
				emailError,
			);
		}
	}

	private async sendRequestStatusUpdateNotification(
		requestId: string,
		status: RequestStatus,
	) {
		try {
			const requestWithUsers = await this.prisma.request.findUnique({
				where: { id: requestId },
				include: {
					student: {
						include: {
							user: true,
						},
					},
					group: {
						include: {
							semester: true,
							studentGroupParticipations: {
								where: { isLeader: true },
								include: {
									student: {
										include: {
											user: true,
										},
									},
								},
							},
						},
					},
				},
			});

			if (!requestWithUsers) return;

			const studentName = requestWithUsers.student.user.fullName;
			const leaderName =
				requestWithUsers.group.studentGroupParticipations[0]?.student.user
					.fullName ?? 'Group Leader';

			let emailRecipient: string | undefined;
			let recipientName = '';

			// Determine email recipient based on request type
			if (requestWithUsers.type === RequestType.Join) {
				// For join requests, notify the student who sent the request
				emailRecipient = requestWithUsers.student.user.email;
				recipientName = studentName;
			} else if (requestWithUsers.type === RequestType.Invite) {
				// For invite requests, notify the group leader who sent the invite
				emailRecipient =
					requestWithUsers.group.studentGroupParticipations[0]?.student.user
						.email;
				recipientName = leaderName;
			}

			if (emailRecipient) {
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_REQUEST_STATUS_UPDATE,
					{
						to: emailRecipient,
						subject: `Request ${status}: ${requestWithUsers.group.name} (${requestWithUsers.group.code})`,
						context: {
							recipientName,
							requestType: requestWithUsers.type,
							requestStatus: status,
							groupName: requestWithUsers.group.name,
							groupCode: requestWithUsers.group.code,
							studentName,
							leaderName,
							semesterName: requestWithUsers.group.semester.name,
							updateDate: new Date().toLocaleDateString(),
						},
					},
				);
			}
		} catch (emailError) {
			this.logger.warn(
				'Failed to send request status update email',
				emailError,
			);
		}
	}
}
