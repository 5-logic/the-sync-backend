import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailJobType, EmailQueueService } from '@/queue';

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
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
	) {}

	async validateSemesterStatus(semesterId: string) {
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

	async validateStudentEnrollment(userId: string, semesterId: string) {
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

	async validateStudentNotInGroup(userId: string, semesterId: string) {
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

	async validateNoPendingJoinRequest(userId: string) {
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

	async validateGroupCapacity(groupId: string) {
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

	async validateStudentIsGroupLeader(userId: string, groupId: string) {
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

	async validateNoPendingInviteRequest(studentId: string, groupId: string) {
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

	async validateUpdatePermissions(
		userId: string,
		request: { type: RequestType; studentId: string; groupId: string },
		status: RequestStatus,
	) {
		if (request.type === RequestType.Join) {
			await this.validateJoinRequestPermissions(userId, request, status);
		} else if (request.type === RequestType.Invite) {
			await this.validateInviteRequestPermissions(userId, request, status);
		}
	}

	private async validateJoinRequestPermissions(
		userId: string,
		request: { studentId: string; groupId: string },
		status: RequestStatus,
	) {
		if (status === RequestStatus.Cancelled && userId !== request.studentId) {
			throw new ForbiddenException(
				`Only the student who sent the join request can cancel it`,
			);
		} else if (status !== RequestStatus.Cancelled) {
			await this.validateStudentIsGroupLeader(userId, request.groupId);
		}
	}

	private async validateInviteRequestPermissions(
		userId: string,
		request: { studentId: string; groupId: string },
		status: RequestStatus,
	) {
		if (status === RequestStatus.Cancelled) {
			await this.validateStudentIsGroupLeader(userId, request.groupId);
		} else if (userId !== request.studentId) {
			throw new ForbiddenException(
				`Only the invited student can respond to this invitation`,
			);
		}
	}

	async validateRequestApproval(request: {
		studentId: string;
		groupId: string;
		group: { semesterId: string };
	}) {
		await this.validateSemesterStatus(request.group.semesterId);

		await this.validateStudentNotInGroup(
			request.studentId,
			request.group.semesterId,
		);

		await this.validateGroupCapacity(request.groupId);
	}

	async sendJoinRequestNotification(
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

	async sendInviteRequestNotification(
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

	async sendRequestStatusUpdateNotification(
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

			if (requestWithUsers.type === RequestType.Join) {
				emailRecipient = requestWithUsers.student.user.email;
				recipientName = studentName;
			} else if (requestWithUsers.type === RequestType.Invite) {
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
