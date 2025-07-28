import {
	BadGatewayException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { GroupPublicService } from '@/groups/services';
import { GroupService } from '@/groups/services/group.service';
import { PrismaService } from '@/providers';

@Injectable()
export class GroupModeratorService {
	private readonly logger = new Logger(GroupModeratorService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly groupService: GroupService,
		private readonly groupPublicService: GroupPublicService,
	) {}

	async assignStudent(groupId: string, studentId: string, moderatorId: string) {
		try {
			this.logger.log(
				`Moderator ${moderatorId} is assigning student ${studentId} to group ${groupId}`,
			);

			// Validate inputs and get required data in parallel
			const [group, student, moderator, existingParticipation] =
				await Promise.all([
					this.prisma.group.findUnique({
						where: { id: groupId },
						include: {
							semester: {
								select: {
									id: true,
									name: true,
									code: true,
									status: true,
									maxGroup: true,
								},
							},
							_count: {
								select: {
									studentGroupParticipations: true,
								},
							},
						},
					}),
					this.prisma.student.findUnique({
						where: { userId: studentId },
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
							major: {
								select: {
									id: true,
									name: true,
									code: true,
								},
							},
						},
					}),
					this.prisma.lecturer.findUnique({
						where: { userId: moderatorId },
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					}),
					this.prisma.studentGroupParticipation.findFirst({
						where: {
							studentId: studentId,
							semesterId: { not: undefined },
						},
						include: {
							group: {
								select: {
									id: true,
									code: true,
									name: true,
									semester: {
										select: {
											id: true,
											name: true,
										},
									},
								},
							},
						},
					}),
				]);

			// Validations
			if (!group) {
				throw new NotFoundException(`Group not found`);
			}

			if (!student) {
				throw new NotFoundException(`Student not found`);
			}

			if (!moderator?.isModerator) {
				throw new ConflictException(
					`Access denied. Only moderators can assign students to groups`,
				);
			}

			// Check if student is enrolled in the group's semester
			const enrollment = await this.prisma.enrollment.findUnique({
				where: {
					studentId_semesterId: {
						studentId: studentId,
						semesterId: group.semesterId,
					},
				},
			});

			if (!enrollment) {
				throw new ConflictException(
					`Student is not enrolled in semester "${group.semester.name}". Cannot assign to group.`,
				);
			}

			// Check if student is already in a group in the same semester
			if (
				existingParticipation &&
				existingParticipation.group.semester.id === group.semesterId
			) {
				throw new ConflictException(
					`Student is already a member of group "${existingParticipation.group.name}" (${existingParticipation.group.code}) in semester "${existingParticipation.group.semester.name}"`,
				);
			}

			// Check if student is already in this specific group
			const existingInThisGroup =
				await this.prisma.studentGroupParticipation.findFirst({
					where: {
						studentId: studentId,
						groupId: groupId,
					},
				});

			if (existingInThisGroup) {
				throw new ConflictException(
					`Student is already a member of this group`,
				);
			}

			// Check semester status - allow assignment only in Preparing phase
			const maxMembersPerGroup = 6;
			if (!['Preparing'].includes(group.semester.status)) {
				throw new ConflictException(
					`Cannot assign student to group. Semester status must be 'Preparing', current status is '${group.semester.status}'`,
				);
			}

			// Check group capacity (max 6 members per group)
			if (group._count.studentGroupParticipations >= maxMembersPerGroup) {
				throw new ConflictException(
					`Cannot assign student to this group. Group has reached maximum capacity of ${maxMembersPerGroup} members. Please assign the student to another group.`,
				);
			}

			// Validate số lượng student chưa có group trong semester
			const studentsWithoutGroup = await this.prisma.enrollment.count({
				where: {
					semesterId: group.semesterId,
					status: 'NotYet',
					student: {
						studentGroupParticipations: {
							every: {
								semesterId: { not: group.semesterId },
							},
						},
					},
				},
			});
			if (studentsWithoutGroup >= 4) {
				throw new BadGatewayException(
					`Cannot assign student to group. There are already ${studentsWithoutGroup} students without a group in this semester. You can notify them to create / join a group.`,
				);
			}

			// Perform the assignment
			const result = await this.prisma.studentGroupParticipation.create({
				data: {
					studentId: studentId,
					groupId: groupId,
					semesterId: group.semesterId,
					isLeader: false, // Assigned students are never leaders initially
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
							major: {
								select: {
									id: true,
									name: true,
									code: true,
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
				`Student "${student.user.fullName}" (${student.user.email}) successfully assigned to group "${group.name}" (${group.code}) by moderator "${moderator.user.fullName}"`,
			);

			// Send email notifications to all group members
			await this.groupService.sendStudentAssignmentNotification(group, student);

			// Return the updated group with the new member
			const updatedGroup = await this.groupPublicService.findOne(groupId);

			return {
				success: true,
				message: `Student "${student.user.fullName}" has been successfully assigned to group "${group.name}" (${group.code})`,
				group: updatedGroup,
				assignedStudent: {
					userId: result.student.userId,
					fullName: result.student.user.fullName,
					email: result.student.user.email,
					major: result.student.major,
					isLeader: result.isLeader,
				},
			};
		} catch (error) {
			this.logger.error(
				`Failed to assign student ${studentId} to group ${groupId}: ${error.message}`,
				error.stack,
			);

			throw error;
		}
	}
}
