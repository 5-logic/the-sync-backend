import {
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailJobType, EmailQueueService } from '@/queue';

import { EnrollmentStatus } from '~/generated/prisma';

export type ThesisAssignmentActionType = 'assigned' | 'picked' | 'unpicked';

@Injectable()
export class GroupService {
	private readonly logger = new Logger(GroupService.name);

	constructor(
		private readonly prisma: PrismaService,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
	) {}

	public static validateSemesterStatus(
		semesterStatus: string,
		allowedStatuses: string[],
		operation: string,
	): void {
		if (!allowedStatuses.includes(semesterStatus)) {
			throw new ConflictException(
				`Cannot ${operation}. Operation is only allowed during ${allowedStatuses.join(' or ')} semester status. Current status is ${semesterStatus}`,
			);
		}
	}

	async getStudentCurrentSemester(userId: string) {
		const enrollment = await this.prisma.enrollment.findFirst({
			where: {
				studentId: userId,
				status: EnrollmentStatus.NotYet,
			},
			include: {
				semester: true,
			},
		});

		if (!enrollment) {
			throw new NotFoundException(
				`Student is not enrolled in any semester with status 'NotYet'`,
			);
		}

		return enrollment.semester;
	}

	async sendStudentAssignmentNotification(group: any, assignedStudent: any) {
		try {
			const groupMembers = await this.prisma.studentGroupParticipation.findMany(
				{
					where: {
						groupId: group.id,
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
					},
				},
			);

			const assignmentDate = new Date().toLocaleDateString();
			const groupLeader = groupMembers.find((member) => member.isLeader);
			const currentGroupSize = groupMembers.length;

			const baseContext = {
				groupName: group.name,
				groupCode: group.code,
				semesterName: group.semester.name,
				targetStudentName: assignedStudent.user.fullName,
				targetStudentCode: assignedStudent.studentCode,
				groupLeaderName:
					groupLeader?.student.user.fullName ?? 'No leader assigned',
				changeDate: assignmentDate,
				actionType: 'assigned',
				currentGroupSize,
			};

			if (assignedStudent.user.email) {
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_GROUP_MEMBER_CHANGE_NOTIFICATION,
					{
						to: assignedStudent.user.email,
						subject: `You have been assigned to Group ${group.code}`,
						context: {
							...baseContext,
							recipientName: assignedStudent.user.fullName,
							recipientType: 'target_student',
						},
					},
				);
			}

			for (const member of groupMembers) {
				if (
					member.studentId !== assignedStudent.userId &&
					member.student.user.email
				) {
					await this.emailQueueService.sendEmail(
						EmailJobType.SEND_GROUP_MEMBER_CHANGE_NOTIFICATION,
						{
							to: member.student.user.email,
							subject: `New member assigned to Group ${group.code}`,
							context: {
								...baseContext,
								recipientName: member.student.user.fullName,
								recipientType: member.isLeader
									? 'group_leader'
									: 'group_member',
							},
						},
					);
				}
			}

			this.logger.log(
				`Student assignment notifications sent for group ${group.code}`,
			);
		} catch (emailError) {
			this.logger.warn(
				'Failed to send student assignment notification emails',
				emailError,
			);
		}
	}

	async sendGroupLeaderChangeNotification(
		group: any,
		previousLeaderParticipation: any,
		newLeaderParticipation: any,
	) {
		try {
			const previousLeaderUser = await this.prisma.student.findUnique({
				where: { userId: previousLeaderParticipation.studentId },
				include: {
					user: {
						select: {
							id: true,
							fullName: true,
							email: true,
						},
					},
				},
			});

			const changeDate = new Date().toLocaleDateString();
			const baseContext = {
				groupName: group.name,
				groupCode: group.code,
				semesterName: group.semester.name,
				previousLeaderName: previousLeaderUser?.user.fullName ?? 'Unknown',
				newLeaderName: newLeaderParticipation.student.user.fullName,
				changeDate,
			};

			// Send email to new leader
			if (newLeaderParticipation.student.user.email) {
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_GROUP_LEADER_CHANGE_NOTIFICATION,
					{
						to: newLeaderParticipation.student.user.email,
						subject: `You are now the leader of Group ${group.code}`,
						context: {
							...baseContext,
							recipientName: newLeaderParticipation.student.user.fullName,
							recipientType: 'new_leader',
						},
					},
				);
			}

			// Send email to previous leader
			if (previousLeaderUser?.user.email) {
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_GROUP_LEADER_CHANGE_NOTIFICATION,
					{
						to: previousLeaderUser.user.email,
						subject: `Leadership transfer completed for Group ${group.code}`,
						context: {
							...baseContext,
							recipientName: previousLeaderUser.user.fullName,
							recipientType: 'previous_leader',
						},
					},
				);
			}

			// Send email to other group members
			const otherMembers = await this.prisma.studentGroupParticipation.findMany(
				{
					where: {
						groupId: group.id,
						studentId: {
							notIn: [
								previousLeaderParticipation.studentId,
								newLeaderParticipation.studentId,
							],
						},
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
					},
				},
			);

			for (const member of otherMembers) {
				if (member.student.user.email) {
					await this.emailQueueService.sendEmail(
						EmailJobType.SEND_GROUP_LEADER_CHANGE_NOTIFICATION,
						{
							to: member.student.user.email,
							subject: `Group leadership change in ${group.code}`,
							context: {
								...baseContext,
								recipientName: member.student.user.fullName,
								recipientType: 'member',
							},
						},
					);
				}
			}

			this.logger.log(
				`Group leader change notifications sent for group ${group.code}`,
			);
		} catch (emailError) {
			this.logger.warn(
				'Failed to send group leader change notification emails',
				emailError,
			);
		}
	}

	private async sendGroupMemberNotification(
		email: string,
		subject: string,
		context: any,
		recipientType: string,
	) {
		if (!email) return;
		await this.emailQueueService.sendEmail(
			EmailJobType.SEND_GROUP_MEMBER_CHANGE_NOTIFICATION,
			{
				to: email,
				subject,
				context: {
					...context,
					recipientName: context.recipientName,
					recipientType,
				},
			},
		);
	}

	async sendStudentRemovalNotification(
		group: any,
		removedStudent: any,
		leaderParticipation: any,
		remainingMembers: any[],
	) {
		const user = await this.prisma.user.findUnique({
			where: { id: leaderParticipation.studentId },
		});

		if (!user) {
			this.logger.warn(
				`Leader user with ID ${leaderParticipation.student.userId} not found`,
			);
			return;
		}

		try {
			const changeDate = new Date().toLocaleDateString();
			const baseContext = {
				groupName: group.name,
				groupCode: group.code,
				semesterName: group.semester.name,
				targetStudentName: removedStudent.user.fullName,
				targetStudentCode: removedStudent.studentCode,
				groupLeaderName: user.fullName,
				changeDate,
				actionType: 'removed',
				currentGroupSize: remainingMembers.length + 1, // before removal
			};

			// Send email to the removed student
			await this.sendGroupMemberNotification(
				removedStudent.user.email as string,
				`You have been removed from Group ${group.code}`,
				{ ...baseContext, recipientName: removedStudent.user.fullName },
				'target_student',
			);

			// Send email to all remaining group members
			for (const member of remainingMembers) {
				await this.sendGroupMemberNotification(
					member.student.user.email as string,
					`Member removed from Group ${group.code}`,
					{ ...baseContext, recipientName: member.student.user.fullName },
					member.isLeader ? 'group_leader' : 'group_member',
				);
			}

			this.logger.log(
				`Student removal notifications sent for group ${group.code}`,
			);
		} catch (emailError) {
			this.logger.warn(
				'Failed to send student removal notification emails',
				emailError,
			);
		}
	}

	async sendStudentLeaveNotification(
		group: any,
		leavingStudent: any,
		remainingMembers: any[],
	) {
		try {
			const leaveDate = new Date().toLocaleDateString();
			const baseContext = {
				groupName: group.name,
				groupCode: group.code,
				semesterName: group.semester.name,
				targetStudentName: leavingStudent.user.fullName,
				targetStudentCode: leavingStudent.studentCode ?? 'N/A',
				changeDate: leaveDate,
				actionType: 'left',
				currentGroupSize: remainingMembers.length,
				groupLeaderName:
					remainingMembers.find((member) => member.isLeader)?.student.user
						.fullName ?? 'No leader assigned',
			};

			// Send email to the leaving student
			if (leavingStudent.user.email) {
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_GROUP_MEMBER_CHANGE_NOTIFICATION,
					{
						to: leavingStudent.user.email,
						subject: `You have left Group ${group.code}`,
						context: {
							...baseContext,
							recipientName: leavingStudent.user.fullName,
							recipientType: 'target_student',
						},
					},
				);
			}

			// Send email to all remaining group members
			for (const member of remainingMembers) {
				if (member.student.user.email) {
					await this.emailQueueService.sendEmail(
						EmailJobType.SEND_GROUP_MEMBER_CHANGE_NOTIFICATION,
						{
							to: member.student.user.email,
							subject: `Member left Group ${group.code}`,
							context: {
								...baseContext,
								recipientName: member.student.user.fullName,
								recipientType: member.isLeader
									? 'group_leader'
									: 'group_member',
							},
						},
					);
				}
			}

			this.logger.log(
				`Student leave notifications sent for group ${group.code}`,
			);
		} catch (emailError) {
			this.logger.warn(
				'Failed to send student leave notification emails',
				emailError,
			);
		}
	}

	async sendThesisAssignmentNotification(
		groupId: string,
		thesisId: string,
		actionType: ThesisAssignmentActionType,
		assignDate?: string,
	) {
		try {
			// Get required data using helper methods
			const group = await this.getGroupForNotification(groupId);
			const thesis = await this.getThesisForNotification(thesisId);
			const groupMembers = await this.getGroupMembersForNotification(groupId);

			// Create base context for email notifications
			const baseContext = this.createNotificationBaseContext(
				group,
				thesis,
				groupMembers,
				actionType,
				assignDate,
			);

			// Send email to thesis lecturer
			await this.sendLecturerNotification(
				thesis.lecturer,
				baseContext,
				actionType,
				group.code,
			);

			// Send email to all group members
			for (const member of groupMembers) {
				await this.sendMemberNotification(
					member,
					baseContext,
					actionType,
					group.code,
				);
			}

			this.logger.log(
				`Thesis ${actionType} notifications sent for group ${group.code} and thesis ${thesis.abbreviation}`,
			);

			return {
				success: true,
				message: `Email notifications sent successfully for thesis ${actionType}`,
			};
		} catch (error) {
			this.logger.error(
				`Failed to send thesis ${actionType} notification emails`,
				error,
			);
			throw error;
		}
	}

	private async getGroupForNotification(groupId: string) {
		const group = await this.prisma.group.findUnique({
			where: { id: groupId },
			include: {
				semester: {
					select: {
						id: true,
						name: true,
						code: true,
					},
				},
			},
		});

		if (!group) {
			throw new NotFoundException(`Group with ID ${groupId} not found`);
		}

		return group;
	}

	private async getThesisForNotification(thesisId: string) {
		const thesis = await this.prisma.thesis.findUnique({
			where: { id: thesisId },
			include: {
				lecturer: {
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
			},
		});

		if (!thesis) {
			throw new NotFoundException(`Thesis with ID ${thesisId} not found`);
		}

		return thesis;
	}

	private async getGroupMembersForNotification(groupId: string) {
		return this.prisma.studentGroupParticipation.findMany({
			where: { groupId: groupId },
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
			},
		});
	}

	private createNotificationBaseContext(
		group: any,
		thesis: any,
		groupMembers: any[],
		actionType: ThesisAssignmentActionType,
		assignDate?: string,
	) {
		const currentDate = new Date().toLocaleDateString();
		const leaderName = groupMembers.find((member) => member.isLeader)?.student
			.user.fullName;

		return {
			groupName: group.name,
			groupCode: group.code,
			semesterName: group.semester.name,
			thesisEnglishName: thesis.englishName,
			thesisVietnameseName: thesis.vietnameseName,
			thesisAbbreviation: thesis.abbreviation,
			lecturerName: thesis.lecturer.user.fullName,
			leaderName,
			actionType,
			assignDate: assignDate ?? currentDate,
			pickDate: actionType === 'picked' ? currentDate : undefined,
			unpickDate: actionType === 'unpicked' ? currentDate : undefined,
		};
	}

	private async sendLecturerNotification(
		lecturer: any,
		baseContext: any,
		actionType: ThesisAssignmentActionType,
		groupCode: string,
	): Promise<void> {
		if (!lecturer.user.email) {
			return;
		}

		const subject = this.getLecturerEmailSubject(actionType, groupCode);

		await this.emailQueueService.sendEmail(
			EmailJobType.SEND_THESIS_ASSIGNMENT_NOTIFICATION,
			{
				to: lecturer.user.email,
				subject: subject,
				context: {
					...baseContext,
					recipientName: lecturer.user.fullName,
					recipientType: 'lecturer',
				},
			},
		);
	}

	private getLecturerEmailSubject(
		actionType: ThesisAssignmentActionType,
		groupCode: string,
	): string {
		switch (actionType) {
			case 'assigned':
				return `Your thesis has been assigned to Group ${groupCode}`;
			case 'picked':
				return `Your thesis has been selected by Group ${groupCode}`;
			case 'unpicked':
				return `Thesis removed from Group ${groupCode}`;
			default:
				return `Thesis update for Group ${groupCode}`;
		}
	}

	private async sendMemberNotification(
		member: any,
		baseContext: any,
		actionType: ThesisAssignmentActionType,
		groupCode: string,
	): Promise<void> {
		if (!member.student.user.email) {
			return;
		}

		const subject = this.getMemberEmailSubject(actionType, groupCode);

		await this.emailQueueService.sendEmail(
			EmailJobType.SEND_THESIS_ASSIGNMENT_NOTIFICATION,
			{
				to: member.student.user.email,
				subject: subject,
				context: {
					...baseContext,
					recipientName: member.student.user.fullName,
					recipientType: member.isLeader ? 'group_leader' : 'group_member',
				},
			},
		);
	}

	private getMemberEmailSubject(
		actionType: ThesisAssignmentActionType,
		groupCode: string,
	): string {
		switch (actionType) {
			case 'assigned':
				return `Thesis assigned to Group ${groupCode}`;
			case 'picked':
				return `Thesis selected for Group ${groupCode}`;
			case 'unpicked':
				return `Thesis removed from Group ${groupCode}`;
			default:
				return `Thesis update for Group ${groupCode}`;
		}
	}

	async sendGroupDeletionNotification(
		deletedGroup: any,
		semester: any,
		groupMembers: any[],
		leaderParticipation: any,
	) {
		try {
			const deletionDate = new Date().toLocaleDateString();
			const leaderName =
				groupMembers.find(
					(member) => member.studentId === leaderParticipation.studentId,
				)?.student.user.fullName ?? 'Group Leader';

			const baseContext = {
				groupName: deletedGroup.name,
				groupCode: deletedGroup.code,
				semesterName: semester.name,
				semesterCode: semester.code,
				leaderName,
				deletionDate,
				memberCount: groupMembers.length,
			};

			// Send email to all group members
			for (const member of groupMembers) {
				if (member.student.user.email) {
					await this.emailQueueService.sendEmail(
						EmailJobType.SEND_GROUP_DELETION_NOTIFICATION,
						{
							to: member.student.user.email,
							subject: `Group ${deletedGroup.code} has been deleted`,
							context: {
								...baseContext,
								recipientName: member.student.user.fullName,
								recipientType: member.isLeader
									? 'group_leader'
									: 'group_member',
								isLeader: member.isLeader,
							},
						},
					);
				}
			}

			this.logger.log(
				`Group deletion notifications sent to ${groupMembers.length} members for group ${deletedGroup.code}`,
			);
		} catch (emailError) {
			this.logger.warn(
				'Failed to send group deletion notification emails',
				emailError,
			);
		}
	}
}
