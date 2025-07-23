import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import { mapStudentGroupParticipationResponse } from '@/requests/mappers';
import { StudentGroupParticipationResponse } from '@/requests/responses';
import { mapSemester } from '@/semesters/mappers';
import { SemesterResponse } from '@/semesters/responses';

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

	async validateSemesterStatus(semesterId: string): Promise<SemesterResponse> {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});

		if (!semester) {
			this.logger.error(`Semester with ID ${semesterId} not found`);
			throw new NotFoundException(`Semester not found`);
		}

		if (semester.status !== SemesterStatus.Preparing) {
			this.logger.error(
				`Cannot send/process requests. Semester status must be ${SemesterStatus.Preparing}, current status is ${semester.status}`,
			);
			throw new ConflictException(
				`Cannot send/process requests. Semester status must be ${SemesterStatus.Preparing}, current status is ${semester.status}`,
			);
		}

		return mapSemester(semester);
	}

	async validateStudentEnrollment(
		userId: string,
		semesterId: string,
	): Promise<void> {
		const enrollment = await this.prisma.enrollment.findUnique({
			where: {
				studentId_semesterId: {
					studentId: userId,
					semesterId: semesterId,
				},
			},
		});

		if (!enrollment) {
			this.logger.error(
				`Student with ID ${userId} is not enrolled in semester with ID ${semesterId}`,
			);
			throw new NotFoundException(`Student is not enrolled in this semester`);
		}

		if (enrollment.status !== EnrollmentStatus.NotYet) {
			this.logger.error(
				`Student with ID ${userId} has enrollment status ${enrollment.status}, expected NotYet`,
			);
			throw new ConflictException(
				`Student enrollment status must be 'NotYet' to join/invite groups`,
			);
		}
	}

	async validateStudentNotInGroup(
		userId: string,
		semesterId: string,
	): Promise<void> {
		const existingParticipation =
			await this.prisma.studentGroupParticipation.findFirst({
				where: {
					studentId: userId,
					semesterId: semesterId,
				},
			});

		if (existingParticipation) {
			this.logger.error(
				`Student with ID ${userId} is already in a group for semester with ID ${semesterId}`,
			);
			throw new ConflictException(
				`Student is already a member of a group in this semester`,
			);
		}
	}

	async validateNoPendingJoinRequest(userId: string): Promise<void> {
		const pendingRequest = await this.prisma.request.findFirst({
			where: {
				studentId: userId,
				type: RequestType.Join,
				status: RequestStatus.Pending,
			},
		});

		if (pendingRequest) {
			this.logger.error(
				`Student with ID ${userId} already has a pending join request`,
			);
			throw new ConflictException(
				`Student already has a pending join request. Cancel it before sending a new one`,
			);
		}
	}

	async validateGroupCapacity(groupId: string): Promise<number> {
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

	async validateStudentIsGroupLeader(
		userId: string,
		groupId: string,
	): Promise<StudentGroupParticipationResponse> {
		const participation = await this.prisma.studentGroupParticipation.findFirst(
			{
				where: {
					studentId: userId,
					groupId: groupId,
				},
			},
		);

		if (!participation) {
			this.logger.error(
				`Student with ID ${userId} is not a member of group with ID ${groupId}`,
			);
			throw new ForbiddenException(`Student is not a member of this group`);
		}

		if (!participation.isLeader) {
			this.logger.error(
				`Student with ID ${userId} is not the group leader for group with ID ${groupId}`,
			);
			throw new ForbiddenException(
				`Only group leader can manage group requests`,
			);
		}

		return mapStudentGroupParticipationResponse(participation);
	}

	async validateNoPendingInviteRequest(
		studentId: string,
		groupId: string,
	): Promise<void> {
		const pendingRequest = await this.prisma.request.findFirst({
			where: {
				studentId: studentId,
				groupId: groupId,
				type: RequestType.Invite,
				status: RequestStatus.Pending,
			},
		});

		if (pendingRequest) {
			this.logger.error(
				`Pending invite request exists for student ${studentId} in group ${groupId}`,
			);
			throw new ConflictException(
				`There is already a pending invite request for this student`,
			);
		}
	}

	async validateUpdatePermissions(
		userId: string,
		request: { type: RequestType; studentId: string; groupId: string },
		status: RequestStatus,
	): Promise<void> {
		if (request.type === RequestType.Join) {
			await this.validateJoinRequestPermissions(userId, request, status);
		} else if (request.type === RequestType.Invite) {
			await this.validateInviteRequestPermissions(userId, request, status);
		}
	}

	async validateJoinRequestPermissions(
		userId: string,
		request: { studentId: string; groupId: string },
		status: RequestStatus,
	): Promise<void> {
		if (status === RequestStatus.Cancelled && userId !== request.studentId) {
			this.logger.error(
				`Student with ID ${userId} attempted to cancel join request not sent by them`,
			);
			throw new ForbiddenException(
				`Only the student who sent the join request can cancel it`,
			);
		} else if (status !== RequestStatus.Cancelled) {
			await this.validateStudentIsGroupLeader(userId, request.groupId);
		}
	}

	async validateInviteRequestPermissions(
		userId: string,
		request: { studentId: string; groupId: string },
		status: RequestStatus,
	): Promise<void> {
		if (status === RequestStatus.Cancelled) {
			await this.validateStudentIsGroupLeader(userId, request.groupId);
		} else if (userId !== request.studentId) {
			this.logger.error(
				`Student with ID ${userId} attempted to respond to invite request not sent to them`,
			);
			throw new ForbiddenException(
				`Only the invited student can respond to this invitation`,
			);
		}
	}

	async validateRequestApproval(request: {
		studentId: string;
		groupId: string;
		group: { semesterId: string };
	}): Promise<void> {
		await this.validateSemesterStatus(request.group.semesterId);

		await this.validateStudentNotInGroup(
			request.studentId,
			request.group.semesterId,
		);

		await this.validateGroupCapacity(request.groupId);
	}

	async sendJoinRequestNotification(
		leader: { fullName: string; email: string },
		student: { fullName: string; email: string },
		group: { code: string; name: string; semester: { name: string } },
	): Promise<void> {
		try {
			if (leader.email) {
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_JOIN_REQUEST_NOTIFICATION,
					{
						to: leader.email,
						subject: `New Join Request for Group ${group.code}`,
						context: {
							leaderName: leader.fullName,
							studentName: student.fullName,
							studentEmail: student.email,
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
		leader: { fullName: string; email: string },
		student: { fullName: string; email: string },
		group: { code: string; name: string; semester: { name: string } },
	) {
		try {
			if (student.email) {
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_INVITE_REQUEST_NOTIFICATION,
					{
						to: student.email,
						subject: `Group Invitation from ${group.code}`,
						context: {
							studentName: student.fullName,
							groupName: group.name,
							groupCode: group.code,
							leaderName: leader.fullName,
							leaderEmail: leader.email,
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
