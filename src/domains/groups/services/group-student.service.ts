import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CONSTANTS } from '@/configs';
import {
	ChangeLeaderDto,
	CreateGroupDto,
	PickThesisDto,
	UpdateGroupDto,
} from '@/groups/dtos';
import { GroupPublicService } from '@/groups/services';
import { GroupService } from '@/groups/services/group.service';
import { PrismaService } from '@/providers';

import { SemesterStatus, ThesisStatus } from '~/generated/prisma';

@Injectable()
export class GroupStudentService {
	private readonly logger = new Logger(GroupStudentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly groupService: GroupService,
		private readonly groupPublicService: GroupPublicService,
	) {}

	async create(userId: string, dto: CreateGroupDto) {
		try {
			const [currentSemester] = await Promise.all([
				this.groupService.getStudentCurrentSemester(userId),
				this.groupService.validateSkillsAndResponsibilities(
					dto.skillIds,
					dto.responsibilityIds,
				),
			]);

			if (currentSemester.status !== SemesterStatus.Preparing) {
				throw new ConflictException(
					`Cannot create group. Semester status must be ${SemesterStatus.Preparing}, current status is ${currentSemester.status}`,
				);
			}

			const [currentTotalGroups, existingParticipation] = await Promise.all([
				this.prisma.group.count({
					where: { semesterId: currentSemester.id },
				}),
				this.prisma.studentGroupParticipation.findFirst({
					where: {
						studentId: userId,
						semesterId: currentSemester.id,
					},
					include: {
						group: {
							select: {
								id: true,
								code: true,
								name: true,
							},
						},
					},
				}),
			]);

			this.logger.log('Total current group', currentTotalGroups);

			if (existingParticipation) {
				throw new ConflictException(
					`Student is already a member of group "${existingParticipation.group.name}" (${existingParticipation.group.code}) in this semester`,
				);
			}

			const result = await this.prisma.$transaction(
				async (prisma) => {
					const lastGroup = await prisma.group.findFirst({
						where: {
							semesterId: currentSemester.id,
							code: {
								startsWith: `${currentSemester.code}QN`,
							},
						},
						orderBy: {
							code: 'desc',
						},
					});

					let sequenceNumber = 1;
					if (lastGroup) {
						const lastCode = lastGroup.code;
						const lastSequence = parseInt(lastCode.slice(-3), 10);
						sequenceNumber = lastSequence + 1;
					}

					const groupCode = `${currentSemester.code}QN${sequenceNumber
						.toString()
						.padStart(3, '0')}`;

					const group = await prisma.group.create({
						data: {
							code: groupCode,
							name: dto.name,
							projectDirection: dto.projectDirection,
							semesterId: currentSemester.id,
						},
					});

					// Create student group participation
					await prisma.studentGroupParticipation.create({
						data: {
							studentId: userId,
							groupId: group.id,
							semesterId: currentSemester.id,
							isLeader: true,
						},
					});

					// Create group skills if provided
					if (dto.skillIds && dto.skillIds.length > 0) {
						const groupRequiredSkills = dto.skillIds.map((skillId) => ({
							groupId: group.id,
							skillId: skillId,
						}));

						await prisma.groupRequiredSkill.createMany({
							data: groupRequiredSkills,
						});
					}

					// Create group responsibilities if provided
					if (dto.responsibilityIds && dto.responsibilityIds.length > 0) {
						const groupExpectedResponsibilities = dto.responsibilityIds.map(
							(responsibilityId) => ({
								groupId: group.id,
								responsibilityId: responsibilityId,
							}),
						);

						await prisma.groupExpectedResponsibility.createMany({
							data: groupExpectedResponsibilities,
						});
					}

					return group;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(
				`Group "${result.name}" created with ID: ${result.id} by student ${userId} in semester ${currentSemester.name}`,
			);

			const completeGroup = await this.groupPublicService.findOne(result.id);

			return completeGroup;
		} catch (error) {
			this.logger.error(
				`Failed to create group: ${error.message}`,
				error.stack,
			);
			throw error;
		}
	}

	async update(id: string, userId: string, dto: UpdateGroupDto) {
		try {
			this.logger.log(`Updating group with ID: ${id}`);

			const [existingGroup, participation] = await Promise.all([
				this.prisma.group.findUnique({
					where: { id },
					include: {
						semester: true,
					},
				}),
				this.prisma.studentGroupParticipation.findFirst({
					where: {
						studentId: userId,
						groupId: id,
					},
					include: {
						group: {
							select: {
								code: true,
								name: true,
							},
						},
					},
				}),
			]);

			if (!existingGroup) {
				throw new NotFoundException(`Group not found`);
			}

			if (!participation) {
				throw new NotFoundException(`Student is not a member of this group`);
			}

			if (!participation.isLeader) {
				throw new ConflictException(
					`Access denied. Only the group leader can update group "${participation.group.name}" (${participation.group.code}) information`,
				);
			}

			if (existingGroup.semester.status !== SemesterStatus.Preparing) {
				throw new ConflictException(
					`Cannot create/update group. Semester status must be ${SemesterStatus.Preparing}, current status is ${existingGroup.semester.status}`,
				);
			}

			await this.groupService.validateSkillsAndResponsibilities(
				dto.skillIds,
				dto.responsibilityIds,
			);

			const result = await this.prisma.$transaction(
				async (prisma) => {
					const group = await prisma.group.update({
						where: { id },
						data: {
							name: dto.name,
							projectDirection: dto.projectDirection,
						},
					});

					await Promise.all([
						this.groupService.updateGroupSkills(id, dto.skillIds),
						this.groupService.updateGroupResponsibilities(
							id,
							dto.responsibilityIds,
						),
					]);

					return group;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(`Group updated with ID: ${result.id}`);

			const completeGroup = await this.groupPublicService.findOne(result.id);

			return completeGroup;
		} catch (error) {
			this.logger.error(
				`Failed to update group: ${error.message}`,
				error.stack,
			);

			throw error;
		}
	}

	async changeLeader(
		groupId: string,
		currentLeaderId: string,
		dto: ChangeLeaderDto,
	) {
		try {
			this.logger.log(`Changing leader for group with ID: ${groupId}`);

			const [
				existingGroup,
				currentLeaderParticipation,
				newLeaderParticipation,
			] = await Promise.all([
				this.prisma.group.findUnique({
					where: { id: groupId },
					include: {
						semester: true,
					},
				}),
				this.prisma.studentGroupParticipation.findFirst({
					where: {
						studentId: currentLeaderId,
						groupId: groupId,
					},
					include: {
						group: {
							select: {
								code: true,
								name: true,
							},
						},
					},
				}),
				this.prisma.studentGroupParticipation.findFirst({
					where: {
						studentId: dto.newLeaderId,
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
					},
				}),
			]);

			if (!existingGroup) {
				throw new NotFoundException(`Group not found`);
			}

			if (!currentLeaderParticipation) {
				throw new NotFoundException(`Student is not a member of this group`);
			}

			if (!currentLeaderParticipation.isLeader) {
				throw new ConflictException(
					`Access denied. Only the group leader can change group leadership for "${currentLeaderParticipation.group.name}" (${currentLeaderParticipation.group.code})`,
				);
			}

			if (!newLeaderParticipation) {
				throw new NotFoundException(
					`New leader is not a member of this group. Only existing members can become leaders.`,
				);
			}

			if (dto.newLeaderId === currentLeaderId) {
				throw new ConflictException(
					`Student is already the leader of this group`,
				);
			}

			if (existingGroup.semester.status !== SemesterStatus.Preparing) {
				throw new ConflictException(
					`Cannot change group leadership. Semester status must be ${SemesterStatus.Preparing}, current status is ${existingGroup.semester.status}`,
				);
			}

			const result = await this.prisma.$transaction(
				async (prisma) => {
					await prisma.studentGroupParticipation.update({
						where: {
							studentId_groupId_semesterId: {
								studentId: currentLeaderId,
								groupId: groupId,
								semesterId: existingGroup.semesterId,
							},
						},
						data: {
							isLeader: false,
						},
					});

					await prisma.studentGroupParticipation.update({
						where: {
							studentId_groupId_semesterId: {
								studentId: dto.newLeaderId,
								groupId: groupId,
								semesterId: existingGroup.semesterId,
							},
						},
						data: {
							isLeader: true,
						},
					});

					return existingGroup;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(
				`Group leadership changed successfully. Group: "${result.name}" (${result.code}), ` +
					`New Leader: ${newLeaderParticipation.student.user.fullName} (${newLeaderParticipation.student.user.email})`,
			);

			await this.groupService.sendGroupLeaderChangeNotification(
				result,
				currentLeaderParticipation,
				newLeaderParticipation,
			);

			const completeGroup = await this.groupPublicService.findOne(result.id);

			return completeGroup;
		} catch (error) {
			this.logger.error(
				`Failed to change group leader: ${error.message}`,
				error.stack,
			);

			throw error;
		}
	}

	async removeStudent(groupId: string, studentId: string, leaderId: string) {
		try {
			this.logger.log(
				`Student ${leaderId} is removing student ${studentId} from group ${groupId}`,
			);

			// Validate inputs and get required data in parallel
			const [group, student, leaderParticipation, participation] =
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
					this.prisma.studentGroupParticipation.findFirst({
						where: {
							studentId: leaderId,
							groupId: groupId,
						},
						include: {
							group: {
								select: {
									code: true,
									name: true,
								},
							},
						},
					}),
					this.prisma.studentGroupParticipation.findFirst({
						where: {
							studentId: studentId,
							groupId: groupId,
						},
					}),
				]);

			// Validations
			if (!group) {
				this.logger.warn(`Group with ID ${groupId} not found`);
				throw new NotFoundException(`Group not found`);
			}

			if (group.thesisId) {
				this.logger.warn(
					`Cannot remove student from group with thesis. Group ID: ${groupId}`,
				);
				throw new ConflictException(
					`Cannot remove student from group with thesis. Please contact a moderator for assistance.`,
				);
			}

			if (!student) {
				this.logger.warn(`Student with ID ${studentId} not found`);
				throw new NotFoundException(`Student not found`);
			}

			if (!leaderParticipation) {
				this.logger.warn(
					`Leader with ID ${leaderId} is not a member of group ${groupId}`,
				);
				throw new NotFoundException(`You are not a member of this group`);
			}

			if (!leaderParticipation.isLeader) {
				throw new ConflictException(
					`Access denied. Only the group leader can remove students from group "${leaderParticipation.group.name}" (${leaderParticipation.group.code})`,
				);
			}

			if (!participation) {
				throw new NotFoundException(`Student is not a member of this group`);
			}

			// Prevent leader from removing themselves
			if (studentId === leaderId) {
				throw new ConflictException(
					`Group leaders cannot remove themselves. Please transfer leadership first or contact a moderator for assistance.`,
				);
			}

			// Check semester status - allow removal only in Preparing phases
			if (!['Preparing'].includes(group.semester.status)) {
				throw new ConflictException(
					`Cannot remove student from group. Semester status must be 'Preparing', current status is '${group.semester.status}'`,
				);
			}

			// Get remaining group members for notification before removal
			const remainingMembers =
				await this.prisma.studentGroupParticipation.findMany({
					where: {
						groupId: groupId,
						studentId: { not: studentId },
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
				});

			// Perform the removal
			await this.prisma.studentGroupParticipation.delete({
				where: {
					studentId_groupId_semesterId: {
						studentId: studentId,
						groupId: groupId,
						semesterId: group.semesterId,
					},
				},
			});

			this.logger.log(
				`Student "${student.user.fullName}" (${student.user.email}) successfully removed from group "${group.name}" (${group.code})`,
			);

			// Send email notifications to all remaining group members and the removed student
			await this.groupService.sendStudentRemovalNotification(
				group,
				student,
				leaderParticipation,
				remainingMembers,
			);

			// Return the updated group
			const updatedGroup = await this.groupPublicService.findOne(groupId);

			return {
				success: true,
				message: `Student "${student.user.fullName}" has been successfully removed from group "${group.name}" (${group.code})`,
				group: updatedGroup,
				removedStudent: {
					userId: student.userId,
					fullName: student.user.fullName,
					email: student.user.email,
					major: student.major,
				},
			};
		} catch (error) {
			this.logger.error(
				`Failed to remove student from group: ${error.message}`,
			);

			throw error;
		}
	}

	async leaveGroup(groupId: string, studentId: string) {
		try {
			this.logger.log(`Student ${studentId} is leaving group ${groupId}`);

			// Validate inputs and get required data in parallel
			const [group, participation] = await Promise.all([
				this.prisma.group.findUnique({
					where: { id: groupId },
					include: {
						semester: {
							select: {
								id: true,
								name: true,
								code: true,
								status: true,
							},
						},
						thesis: {
							select: {
								id: true,
								englishName: true,
								abbreviation: true,
							},
						},
						_count: {
							select: {
								studentGroupParticipations: true,
							},
						},
					},
				}),
				this.prisma.studentGroupParticipation.findFirst({
					where: {
						studentId: studentId,
						groupId: groupId,
					},
					include: {
						group: {
							select: {
								code: true,
								name: true,
							},
						},
					},
				}),
			]);

			// Validations
			if (!group) {
				throw new NotFoundException(`Group not found`);
			}

			if (!participation) {
				throw new NotFoundException(`You are not a member of this group`);
			}

			// Check semester status - only allow leaving during PREPARING phase
			if (group.semester.status !== SemesterStatus.Preparing) {
				throw new ConflictException(
					`Cannot leave group. You can only leave groups during the PREPARING semester status. Current status is ${group.semester.status}`,
				);
			}

			if (group.thesis) {
				throw new ConflictException(
					`Cannot leave group. Your group is assigned to a thesis "${group.thesis.englishName}" (${group.thesis.abbreviation}). Please contact your thesis supervisor for assistance.`,
				);
			}

			// Check if student is the leader and if there are other members
			if (
				participation.isLeader &&
				group._count.studentGroupParticipations > 1
			) {
				throw new ConflictException(
					`Cannot leave group. As the group leader, you must transfer leadership to another member before leaving the group "${participation.group.name}" (${participation.group.code}). Use the change leader feature first.`,
				);
			}

			// Get student info for notifications
			const student = await this.prisma.student.findUnique({
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
			});

			if (!student) {
				throw new NotFoundException(`Student not found`);
			}

			// Get remaining group members for notification before removal
			const remainingMembers =
				await this.prisma.studentGroupParticipation.findMany({
					where: {
						groupId: groupId,
						studentId: { not: studentId },
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
				});

			// Remove the student from the group
			await this.prisma.studentGroupParticipation.delete({
				where: {
					studentId_groupId_semesterId: {
						studentId: studentId,
						groupId: groupId,
						semesterId: group.semesterId,
					},
				},
			});

			this.logger.log(
				`Student "${student.user.fullName}" (${student.user.email}) successfully left group "${group.name}" (${group.code})`,
			);

			// Send email notifications to remaining group members and the leaving student
			if (remainingMembers.length > 0) {
				await this.groupService.sendStudentLeaveNotification(
					group,
					student,
					remainingMembers,
				);
			}

			// Determine response based on whether group is now empty
			const isGroupNowEmpty = group._count.studentGroupParticipations === 1;
			let updatedGroup: any = null;

			if (!isGroupNowEmpty) {
				// Return the updated group if it still has members
				updatedGroup = await this.groupPublicService.findOne(groupId);
			}

			return {
				success: true,
				message: isGroupNowEmpty
					? `You have successfully left group "${group.name}" (${group.code}). The group is now empty and available for other students to join.`
					: `You have successfully left group "${group.name}" (${group.code}). Remaining ${remainingMembers.length} members have been notified.`,
				groupDeleted: false,
				group: updatedGroup,
				leftStudent: {
					userId: student.userId,
					fullName: student.user.fullName,
					email: student.user.email,
					major: student.major,
				},
			};
		} catch (error) {
			this.logger.error(`Failed to leave group: ${error.message}`);
			throw error;
		}
	}

	async pickThesis(groupId: string, leaderId: string, dto: PickThesisDto) {
		try {
			this.logger.log(
				`Group leader ${leaderId} is picking thesis ${dto.thesisId} for group ${groupId}`,
			);

			// Validate inputs and get required data in parallel
			const [group, leaderParticipation, thesis] = await Promise.all([
				this.prisma.group.findUnique({
					where: { id: groupId },
					include: {
						semester: true,
						thesis: {
							select: {
								id: true,
								englishName: true,
								vietnameseName: true,
							},
						},
					},
				}),
				this.prisma.studentGroupParticipation.findFirst({
					where: {
						studentId: leaderId,
						groupId: groupId,
					},
					include: {
						group: {
							select: {
								code: true,
								name: true,
							},
						},
					},
				}),
				this.prisma.thesis.findUnique({
					where: { id: dto.thesisId },
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
						semester: {
							select: {
								id: true,
								name: true,
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
				}),
			]);

			// Validations
			if (!group) {
				throw new NotFoundException(`Group not found`);
			}

			if (!leaderParticipation) {
				throw new NotFoundException(`You are not a member of this group`);
			}

			if (!leaderParticipation.isLeader) {
				throw new ConflictException(
					`Access denied. Only the group leader can pick thesis for group "${leaderParticipation.group.name}" (${leaderParticipation.group.code})`,
				);
			}

			if (!thesis) {
				throw new NotFoundException(`Thesis not found`);
			}
			// Check semester status - only allow picking during PICKING or ONGOING (ScopeAdjustable)
			const isPicking = group.semester.status === SemesterStatus.Picking;
			const isOngoingAdjustable =
				group.semester.status === SemesterStatus.Ongoing &&
				group.semester.ongoingPhase === 'ScopeAdjustable';
			if (!(isPicking || isOngoingAdjustable)) {
				throw new ConflictException(
					'Can only pick thesis during Picking or Ongoing (ScopeAdjustable) phase',
				);
			}

			// Check if group is in same semester as thesis
			if (group.semesterId !== thesis.semesterId) {
				throw new ConflictException(
					`Cannot pick thesis. The thesis belongs to semester "${thesis.semester.name}" but your group is in semester "${group.semester.name}"`,
				);
			}

			// Check if group already has a thesis
			if (group.thesis) {
				throw new ConflictException(
					`Cannot pick thesis. Group already has thesis "${group.thesis.vietnameseName}" (${group.thesis.englishName}) assigned. Please unpick the current thesis first.`,
				);
			}

			// Check if thesis is published
			if (!thesis.isPublish) {
				throw new ConflictException(
					`Cannot pick thesis. The thesis "${thesis.vietnameseName}" is not published yet. Only published theses can be picked by groups.`,
				);
			}

			// Check if thesis is approved
			if (thesis.status !== ThesisStatus.Approved) {
				throw new ConflictException(
					`Cannot pick thesis. The thesis "${thesis.vietnameseName}" has status "${thesis.status}". Only approved theses can be picked by groups.`,
				);
			}

			// Check if thesis is already assigned to another group
			if (thesis.group) {
				throw new ConflictException(
					`Cannot pick thesis. The thesis "${thesis.vietnameseName}" is already assigned to group "${thesis.group.name}" (${thesis.group.code})`,
				);
			}

			// Perform thesis assignment in a transaction
			await this.prisma.$transaction(
				async (prisma) => {
					// Update group with thesis assignment
					await prisma.group.update({
						where: { id: groupId },
						data: {
							thesisId: dto.thesisId,
						},
					});

					// Update thesis with group assignment
					await prisma.thesis.update({
						where: { id: dto.thesisId },
						data: {
							groupId: groupId,
						},
					});
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);
			this.logger.log(
				`Thesis "${thesis.vietnameseName}" successfully assigned to group "${group.name}" (${group.code}) by leader`,
			);

			// Send email notifications
			await this.groupService.sendThesisAssignmentNotification(
				group.id,
				thesis.id,
				'picked',
			);

			// Return the updated group with thesis information
			const completeGroup = await this.groupPublicService.findOne(groupId);

			return {
				success: true,
				message: `Thesis "${thesis.vietnameseName}" has been successfully assigned to group "${group.name}" (${group.code}). All group members and thesis lecturer have been notified.`,
				group: completeGroup,
				assignedThesis: {
					id: thesis.id,
					englishName: thesis.englishName,
					vietnameseName: thesis.vietnameseName,
					abbreviation: thesis.abbreviation,
					lecturer: thesis.lecturer.user,
				},
			};
		} catch (error) {
			this.logger.error(
				`Failed to pick thesis for group: ${error.message}`,
				error.stack,
			);

			throw error;
		}
	}

	async unpickThesis(groupId: string, userId: string) {
		try {
			this.logger.log(
				`User ${userId} is unpicking thesis for group ${groupId}`,
			);

			// Lấy thông tin group, leaderParticipation, moderator
			const [group, leaderParticipation, moderator] = await Promise.all([
				this.prisma.group.findUnique({
					where: { id: groupId },
					include: {
						semester: true,
						thesis: {
							include: {
								lecturer: { include: { user: true } },
							},
						},
					},
				}),
				this.prisma.studentGroupParticipation.findFirst({
					where: { studentId: userId, groupId },
					select: { isLeader: true },
				}),
				this.prisma.lecturer.findUnique({
					where: { userId },
					select: { isModerator: true },
				}),
			]);

			if (!group) {
				throw new NotFoundException('Group not found');
			}

			const isLeader = leaderParticipation?.isLeader;
			const isModerator = moderator?.isModerator;

			if (isModerator) {
				GroupService.validateSemesterStatus(
					group.semester.status as string,
					[SemesterStatus.Preparing],
					'unpick thesis',
				);
			} else if (isLeader) {
				const isPicking = group.semester.status === SemesterStatus.Picking;
				const isOngoingAdjustable =
					group.semester.status === SemesterStatus.Ongoing &&
					group.semester.ongoingPhase === 'ScopeAdjustable';
				if (!(isPicking || isOngoingAdjustable)) {
					throw new ConflictException(
						'Can only unpick thesis during Picking or Ongoing (ScopeAdjustable) phase',
					);
				}
			} else {
				throw new ConflictException(
					'You do not have permission to unpick thesis for this group',
				);
			}

			// Check if group has a thesis assigned
			if (!group.thesis) {
				throw new ConflictException(
					`Cannot unpick thesis. Group "${group.name}" (${group.code}) does not have any thesis assigned.`,
				);
			}

			// Store thesis info for notifications before removal
			const thesisInfo = {
				id: group.thesis.id,
				englishName: group.thesis.englishName,
				vietnameseName: group.thesis.vietnameseName,
				abbreviation: group.thesis.abbreviation,
				lecturer: group.thesis.lecturer.user,
			};

			// Perform thesis removal in a transaction
			await this.prisma.$transaction(
				async (prisma) => {
					// Remove thesis assignment from group
					await prisma.group.update({
						where: { id: groupId },
						data: {
							thesisId: null,
						},
					});

					// Remove group assignment from thesis
					await prisma.thesis.update({
						where: { id: group.thesis!.id },
						data: {
							groupId: null,
						},
					});

					// Cancel approved thesis application if exists
					const approvedApplication = await prisma.thesisApplication.findUnique(
						{
							where: {
								groupId_thesisId: {
									groupId: groupId,
									thesisId: group.thesis!.id,
								},
							},
						},
					);

					if (
						approvedApplication &&
						approvedApplication.status === ThesisStatus.Approved
					) {
						await prisma.thesisApplication.update({
							where: {
								groupId_thesisId: {
									groupId: groupId,
									thesisId: group.thesis!.id,
								},
							},
							data: {
								status: 'Cancelled',
								updatedAt: new Date(),
							},
						});

						this.logger.log(
							`Approved thesis application automatically cancelled when unpicking thesis ${group.thesis!.id} from group ${groupId}`,
						);
					}
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(
				`Thesis "${thesisInfo.vietnameseName}" successfully removed from group "${group.name}" (${group.code}) by ${isModerator ? 'moderator' : 'leader'}`,
			);

			// Send email notifications
			await this.groupService.sendThesisAssignmentNotification(
				group.id,
				thesisInfo.id,
				'unpicked',
			);

			// Return the updated group without thesis
			const completeGroup = await this.groupPublicService.findOne(groupId);

			return {
				success: true,
				message: `Thesis "${thesisInfo.vietnameseName}" has been successfully removed from group "${group.name}" (${group.code}). All group members and thesis lecturer have been notified.`,
				group: completeGroup,
				removedThesis: thesisInfo,
			};
		} catch (error) {
			this.logger.error(
				`Failed to unpick thesis for group: ${error.message}`,
				error.stack,
			);

			throw error;
		}
	}

	async delete(groupId: string, userId: string) {
		try {
			this.logger.log(`Deleting group with ID: ${groupId} by user: ${userId}`);

			// Get group details with all necessary data for validation
			const [group, leaderParticipation, moderator] = await Promise.all([
				this.prisma.group.findUnique({
					where: { id: groupId },
					include: {
						semester: {
							select: { id: true, status: true, name: true, code: true },
						},
						thesis: { select: { id: true } },
						_count: {
							select: { studentGroupParticipations: true, submissions: true },
						},
					},
				}),
				this.prisma.studentGroupParticipation.findFirst({
					where: { studentId: userId, groupId },
					select: {
						isLeader: true,
						group: { select: { code: true, name: true } },
					},
				}),
				this.prisma.lecturer.findUnique({
					where: { userId },
					select: { isModerator: true },
				}),
			]);

			if (!group) throw new NotFoundException('Group not found');
			if (!leaderParticipation && !moderator?.isModerator)
				throw new NotFoundException('Student is not a member of this group');

			const isLeader = leaderParticipation?.isLeader;
			const isModerator = moderator?.isModerator;

			if (!isLeader && !isModerator) {
				throw new ConflictException(
					`Access denied. Only the group leader or a moderator can delete group "${leaderParticipation?.group?.name ?? ''}" (${leaderParticipation?.group?.code ?? ''})`,
				);
			}

			if (group.semester.status !== SemesterStatus.Preparing)
				throw new ConflictException(
					`Cannot delete group. Groups can only be deleted during the PREPARING semester status. Current status is ${group.semester.status}`,
				);

			if (group.thesis)
				throw new ConflictException(
					'Cannot delete group. Group has an assigned thesis. Please remove the thesis assignment first or contact a moderator for assistance.',
				);

			if (group._count.submissions > 0)
				throw new ConflictException(
					`Cannot delete group. Group has ${group._count.submissions} milestone submission(s). Groups with submissions cannot be deleted.`,
				);

			// Get all group members for email notification before deletion
			const groupMembers = await this.prisma.studentGroupParticipation.findMany(
				{
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
					},
				},
			);

			// Perform deletion in a transaction
			const result = await this.prisma.$transaction(
				async (prisma) => {
					// Delete all related records first (cascade deletions)
					await Promise.all([
						// Delete group required skills
						prisma.groupRequiredSkill.deleteMany({
							where: { groupId: groupId },
						}),
						// Delete group expected responsibilities
						prisma.groupExpectedResponsibility.deleteMany({
							where: { groupId: groupId },
						}),
						// Delete all pending requests for this group
						prisma.request.deleteMany({
							where: { groupId: groupId },
						}),
						// Delete student group participations
						prisma.studentGroupParticipation.deleteMany({
							where: { groupId: groupId },
						}),
					]);

					// Finally, delete the group itself
					const deletedGroup = await prisma.group.delete({
						where: { id: groupId },
					});

					return deletedGroup;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);
			this.logger.log(
				`Group "${result.name}" (${result.code}) successfully deleted by leader. ${groupMembers.length} members affected.`,
			);

			// Send email notifications to all group members
			await this.groupService.sendGroupDeletionNotification(
				result,
				group.semester,
				groupMembers,
				leaderParticipation,
			);

			return result;
		} catch (error) {
			this.logger.error(
				`Failed to delete group: ${error.message}`,
				error.stack,
			);

			throw error;
		}
	}
}
