import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { BaseCacheService } from '@/bases/base-cache.service';
import {
	ChangeLeaderDto,
	CreateGroupDto,
	PickThesisDto,
	UpdateGroupDto,
} from '@/groups/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';

import { EnrollmentStatus, SemesterStatus } from '~/generated/prisma';

// Define a type alias for thesis assignment actions
export type ThesisAssignmentActionType = 'assigned' | 'picked' | 'unpicked';

@Injectable()
export class GroupService extends BaseCacheService {
	private static readonly CACHE_KEY = 'cache:group';

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) cacheManager: Cache,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
	) {
		super(cacheManager, GroupService.name);
	}

	private async validateSkills(skillIds: string[]) {
		if (!skillIds || skillIds.length === 0) return;

		const existingSkillsCount = await this.prisma.skill.count({
			where: {
				id: {
					in: skillIds,
				},
			},
		});

		if (existingSkillsCount !== skillIds.length) {
			const existingSkills = await this.prisma.skill.findMany({
				where: {
					id: {
						in: skillIds,
					},
				},
				select: { id: true },
			});

			const existingSkillIds = existingSkills.map((skill) => skill.id);
			const missingSkillIds = skillIds.filter(
				(id) => !existingSkillIds.includes(id),
			);

			throw new NotFoundException(
				`Skills not found with IDs: ${missingSkillIds.join(', ')}`,
			);
		}
	}

	private async validateResponsibilities(responsibilityIds: string[]) {
		if (!responsibilityIds || responsibilityIds.length === 0) return;

		const existingResponsibilities = await this.prisma.responsibility.findMany({
			where: {
				id: {
					in: responsibilityIds,
				},
			},
			select: { id: true },
		});

		const existingResponsibilityIds = existingResponsibilities.map(
			(resp) => resp.id,
		);
		const missingResponsibilityIds = responsibilityIds.filter(
			(id) => !existingResponsibilityIds.includes(id),
		);

		if (missingResponsibilityIds.length > 0) {
			throw new NotFoundException(
				`Responsibilities not found with IDs: ${missingResponsibilityIds.join(
					', ',
				)}`,
			);
		}
	}

	private async getStudentCurrentSemester(userId: string) {
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

	async create(userId: string, dto: CreateGroupDto) {
		try {
			const [currentSemester] = await Promise.all([
				this.getStudentCurrentSemester(userId),
				this.validateSkillsAndResponsibilities(
					dto.skillIds,
					dto.responsibilityIds,
				),
			]);

			if (currentSemester.status !== SemesterStatus.Preparing) {
				throw new ConflictException(
					`Cannot create group. Semester status must be ${SemesterStatus.Preparing}, current status is ${currentSemester.status}`,
				);
			}

			if (currentSemester.maxGroup == null) {
				this.logger.warn(
					`maxGroup is not set for semester ${currentSemester.id}`,
				);
				throw new ConflictException(
					`Cannot create group. Maximum number of groups for this semester is not configured.`,
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

			if (existingParticipation) {
				throw new ConflictException(
					`Student is already a member of group "${existingParticipation.group.name}" (${existingParticipation.group.code}) in this semester`,
				);
			}

			if (currentTotalGroups >= currentSemester.maxGroup) {
				this.logger.warn(
					`Maximum number of groups for semester ${currentSemester.id} reached: ${currentSemester.maxGroup}`,
				);
				throw new ConflictException(
					`Cannot create group. Maximum number of groups for this semester (${currentSemester.maxGroup}) has been reached.`,
				);
			}

			const result = await this.prisma.$transaction(async (prisma) => {
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

				await Promise.all([
					prisma.studentGroupParticipation.create({
						data: {
							studentId: userId,
							groupId: group.id,
							semesterId: currentSemester.id,
							isLeader: true,
						},
					}),

					this.createGroupSkills(prisma, group.id, dto.skillIds),
					this.createGroupResponsibilities(
						prisma,
						group.id,
						dto.responsibilityIds,
					),
				]);

				return group;
			});

			this.logger.log(
				`Group "${result.name}" created with ID: ${result.id} by student ${userId} in semester ${currentSemester.name}`,
			);

			// Clear only specific cache that might be affected
			await this.clearMultipleCache([
				`${GroupService.CACHE_KEY}:${result.id}`,
				`${GroupService.CACHE_KEY}:${result.id}:skills-responsibilities`,
			]);

			const completeGroup = await this.findOne(result.id);
			return completeGroup;
		} catch (error) {
			this.handleError('creating group', error);
		}
	}

	private async validateSkillsAndResponsibilities(
		skillIds?: string[],
		responsibilityIds?: string[],
	): Promise<void> {
		const validationPromises: Promise<void>[] = [];

		if (skillIds && skillIds.length > 0) {
			validationPromises.push(this.validateSkills(skillIds));
		}

		if (responsibilityIds && responsibilityIds.length > 0) {
			validationPromises.push(this.validateResponsibilities(responsibilityIds));
		}

		if (validationPromises.length > 0) {
			await Promise.all(validationPromises);
		}
	}

	private handleError(operation: string, error: any): never {
		this.logger.error(`Error ${operation}`, error);
		throw error;
	}

	private async createGroupSkills(
		prisma: any,
		groupId: string,
		skillIds?: string[],
	) {
		if (skillIds && skillIds.length > 0) {
			const groupRequiredSkills = skillIds.map((skillId) => ({
				groupId: groupId,
				skillId: skillId,
			}));

			await prisma.groupRequiredSkill.createMany({
				data: groupRequiredSkills,
			});
		}
	}

	private async createGroupResponsibilities(
		prisma: any,
		groupId: string,
		responsibilityIds?: string[],
	) {
		if (responsibilityIds && responsibilityIds.length > 0) {
			const groupExpectedResponsibilities = responsibilityIds.map(
				(responsibilityId) => ({
					groupId: groupId,
					responsibilityId: responsibilityId,
				}),
			);

			await prisma.groupExpectedResponsibility.createMany({
				data: groupExpectedResponsibilities,
			});
		}
	}

	private async updateGroupSkills(
		prisma: any,
		groupId: string,
		skillIds?: string[],
	) {
		if (skillIds !== undefined) {
			await Promise.all([
				prisma.groupRequiredSkill.deleteMany({
					where: { groupId: groupId },
				}),
				skillIds.length > 0
					? this.createGroupSkills(prisma, groupId, skillIds)
					: Promise.resolve(),
			]);
		}
	}

	private async updateGroupResponsibilities(
		prisma: any,
		groupId: string,
		responsibilityIds?: string[],
	) {
		if (responsibilityIds !== undefined) {
			await Promise.all([
				prisma.groupExpectedResponsibility.deleteMany({
					where: { groupId: groupId },
				}),
				responsibilityIds.length > 0
					? this.createGroupResponsibilities(prisma, groupId, responsibilityIds)
					: Promise.resolve(),
			]);
		}
	}

	private getGroupIncludeOptions() {
		return {
			semester: {
				select: {
					id: true,
					name: true,
					code: true,
					status: true,
				},
			},
			groupRequiredSkills: {
				select: {
					skill: {
						select: {
							id: true,
							name: true,
							skillSet: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			},
			groupExpectedResponsibilities: {
				select: {
					responsibility: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
			studentGroupParticipations: {
				select: {
					isLeader: true,
					student: {
						select: {
							userId: true,
							studentCode: true,
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
				},
			},
		};
	}

	// Optimized include for list operations (less data)
	private getGroupListIncludeOptions() {
		return {
			semester: {
				select: {
					id: true,
					name: true,
					code: true,
					status: true,
				},
			},
			_count: {
				select: {
					studentGroupParticipations: true,
					groupRequiredSkills: true,
					groupExpectedResponsibilities: true,
				},
			},
			studentGroupParticipations: {
				where: {
					isLeader: true,
				},
				select: {
					student: {
						select: {
							userId: true,
							studentCode: true,
							user: {
								select: {
									id: true,
									fullName: true,
								},
							},
						},
					},
				},
				take: 1, // Only get the leader
			},
		};
	}

	async findAll() {
		try {
			// Removed caching for findAll() to ensure real-time data
			// Group data changes frequently and needs to be up-to-date
			const groups = await this.prisma.group.findMany({
				select: {
					id: true,
					code: true,
					name: true,
					projectDirection: true,
					createdAt: true,
					updatedAt: true,
					...this.getGroupListIncludeOptions(),
				},
				orderBy: { createdAt: 'desc' },
				take: 1000,
			});

			// Transform data for better frontend consumption
			const transformedGroups = groups.map((group) => ({
				id: group.id,
				code: group.code,
				name: group.name,
				projectDirection: group.projectDirection,
				createdAt: group.createdAt,
				updatedAt: group.updatedAt,
				semester: group.semester,
				memberCount: group._count.studentGroupParticipations,
				skillCount: group._count.groupRequiredSkills,
				responsibilityCount: group._count.groupExpectedResponsibilities,
				leader: group.studentGroupParticipations[0] ?? null,
			}));

			this.logger.log(`Found ${transformedGroups.length} groups`);

			return transformedGroups;
		} catch (error) {
			this.handleError('fetching groups', error);
		}
	}

	async findOne(id: string) {
		try {
			// Use short TTL cache for individual group data since it changes frequently
			const cacheKey = `${GroupService.CACHE_KEY}:${id}`;
			const cachedGroup = await this.getCachedData<any>(cacheKey);
			if (cachedGroup) {
				this.logger.log(`Group found with ID: ${cachedGroup.id} (from cache)`);
				return cachedGroup;
			}

			const group = await this.prisma.group.findUnique({
				where: { id },
				select: {
					id: true,
					code: true,
					name: true,
					projectDirection: true,
					createdAt: true,
					updatedAt: true,
					...this.getGroupIncludeOptions(),
					thesis: {
						select: {
							id: true,
							englishName: true,
							vietnameseName: true,
							abbreviation: true,
							description: true,
							status: true,
							domain: true,
						},
					},
				},
			});

			if (!group) {
				throw new NotFoundException(`Group not found`);
			}

			// Transform data for better frontend consumption
			const transformedGroup = {
				id: group.id,
				code: group.code,
				name: group.name,
				projectDirection: group.projectDirection,
				createdAt: group.createdAt,
				updatedAt: group.updatedAt,
				semester: group.semester,
				thesis: group.thesis,
				skills: group.groupRequiredSkills.map((grs) => grs.skill),
				responsibilities: group.groupExpectedResponsibilities.map(
					(ger) => ger.responsibility,
				),
				members: group.studentGroupParticipations
					.sort((a, b) => {
						// Sort by isLeader desc (leader first), then by fullName asc
						if (a.isLeader && !b.isLeader) return -1;
						if (!a.isLeader && b.isLeader) return 1;
						return a.student.user.fullName.localeCompare(
							b.student.user.fullName,
						);
					})
					.map((sgp) => ({
						...sgp.student,
						isLeader: sgp.isLeader,
					})),
				leader:
					group.studentGroupParticipations.find((sgp) => sgp.isLeader)
						?.student ?? null,
			};

			// Cache for 2 minutes only since group data changes frequently
			await this.setCachedData(cacheKey, transformedGroup, 120000); // 2 minutes TTL

			this.logger.log(`Group found with ID: ${transformedGroup.id}`);

			return transformedGroup;
		} catch (error) {
			this.handleError('fetching group', error);
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

			await this.validateSkillsAndResponsibilities(
				dto.skillIds,
				dto.responsibilityIds,
			);

			const result = await this.prisma.$transaction(async (prisma) => {
				const group = await prisma.group.update({
					where: { id },
					data: {
						name: dto.name,
						projectDirection: dto.projectDirection,
					},
				});

				await Promise.all([
					this.updateGroupSkills(prisma, id, dto.skillIds),
					this.updateGroupResponsibilities(prisma, id, dto.responsibilityIds),
				]);

				return group;
			});

			this.logger.log(`Group updated with ID: ${result.id}`);

			await this.clearGroupRelatedCaches(id, [userId]);

			const completeGroup = await this.findOne(result.id);

			return completeGroup;
		} catch (error) {
			this.handleError('updating group', error);
		}
	}

	async changeLeader(
		groupId: string,
		currentLeaderId: string,
		dto: ChangeLeaderDto,
	) {
		try {
			this.logger.log(`Changing leader for group with ID: ${groupId}`);

			// Run validations in parallel for better performance
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

			// Validate group exists
			if (!existingGroup) {
				throw new NotFoundException(`Group not found`);
			}

			// Validate current user is the leader
			if (!currentLeaderParticipation) {
				throw new NotFoundException(`Student is not a member of this group`);
			}

			if (!currentLeaderParticipation.isLeader) {
				throw new ConflictException(
					`Access denied. Only the group leader can change group leadership for "${currentLeaderParticipation.group.name}" (${currentLeaderParticipation.group.code})`,
				);
			}

			// Validate new leader is a member of the group
			if (!newLeaderParticipation) {
				throw new NotFoundException(
					`New leader is not a member of this group. Only existing members can become leaders.`,
				);
			}

			// Validate new leader is not already the current leader
			if (dto.newLeaderId === currentLeaderId) {
				throw new ConflictException(
					`Student is already the leader of this group`,
				);
			}

			// Validate semester status for leadership change
			if (existingGroup.semester.status !== SemesterStatus.Preparing) {
				throw new ConflictException(
					`Cannot change group leadership. Semester status must be ${SemesterStatus.Preparing}, current status is ${existingGroup.semester.status}`,
				);
			}

			// Perform leadership change in a transaction
			const result = await this.prisma.$transaction(async (prisma) => {
				// Update current leader to regular member
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

				// Update new leader
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
			});

			this.logger.log(
				`Group leadership changed successfully. Group: "${result.name}" (${result.code}), ` +
					`New Leader: ${newLeaderParticipation.student.user.fullName} (${newLeaderParticipation.student.user.email})`,
			);
			// Clear relevant caches
			await this.clearGroupRelatedCaches(groupId, [
				currentLeaderId,
				dto.newLeaderId,
			]);

			// Send email notifications
			await this.sendGroupLeaderChangeNotification(
				result,
				currentLeaderParticipation,
				newLeaderParticipation,
			);

			// Fetch the complete group data with updated leadership
			const completeGroup = await this.findOne(result.id);

			return completeGroup;
		} catch (error) {
			this.handleError('changing group leadership', error);
		}
	}

	// Email notification helper
	private async sendGroupLeaderChangeNotification(
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

	async findByStudentId(studentId: string) {
		try {
			this.logger.log(`Finding groups for student ID: ${studentId}`);

			// Removed caching for real-time data - student group participation changes frequently
			// Find all groups where the student is a participant
			const participations =
				await this.prisma.studentGroupParticipation.findMany({
					where: {
						studentId: studentId,
					},
					select: {
						isLeader: true,
						group: {
							select: {
								id: true,
								code: true,
								name: true,
								projectDirection: true,
								createdAt: true,
								updatedAt: true,
								semester: {
									select: {
										id: true,
										name: true,
										code: true,
										status: true,
									},
								},
								_count: {
									select: {
										studentGroupParticipations: true,
									},
								},
								thesis: {
									select: {
										id: true,
										englishName: true,
										vietnameseName: true,
										status: true,
									},
								},
							},
						},
						semester: {
							select: {
								id: true,
								name: true,
								code: true,
								status: true,
							},
						},
					},
					orderBy: {
						group: {
							createdAt: 'desc',
						},
					},
				});

			// Transform data for better frontend consumption
			const groupsWithParticipation = participations.map((participation) => ({
				id: participation.group.id,
				code: participation.group.code,
				name: participation.group.name,
				projectDirection: participation.group.projectDirection,
				createdAt: participation.group.createdAt,
				updatedAt: participation.group.updatedAt,
				semester: participation.group.semester,
				thesis: participation.group.thesis,
				memberCount: participation.group._count.studentGroupParticipations,
				participation: {
					isLeader: participation.isLeader,
					semester: participation.semester,
				},
			}));

			this.logger.log(
				`Found ${groupsWithParticipation.length} groups for student ID: ${studentId}`,
			);

			return groupsWithParticipation;
		} catch (error) {
			this.handleError('fetching groups by student ID', error);
		}
	}

	async findDetailedByStudentId(studentId: string) {
		try {
			this.logger.log(`Finding detailed groups for student ID: ${studentId}`);

			// Removed caching for real-time data - student group participation changes frequently
			// Find all groups where the student is a participant with detailed data
			const participations =
				await this.prisma.studentGroupParticipation.findMany({
					where: {
						studentId: studentId,
					},
					select: {
						isLeader: true,
						group: {
							select: {
								id: true,
								code: true,
								name: true,
								projectDirection: true,
								createdAt: true,
								updatedAt: true,
								...this.getGroupIncludeOptions(),
								thesis: {
									select: {
										id: true,
										englishName: true,
										vietnameseName: true,
										abbreviation: true,
										description: true,
										status: true,
										domain: true,
									},
								},
							},
						},
						semester: {
							select: {
								id: true,
								name: true,
								code: true,
								status: true,
							},
						},
					},
					orderBy: {
						group: {
							createdAt: 'desc',
						},
					},
				});

			// Transform data for better frontend consumption (similar to findOne)
			const detailedGroupsWithParticipation = participations.map(
				(participation) => ({
					id: participation.group.id,
					code: participation.group.code,
					name: participation.group.name,
					projectDirection: participation.group.projectDirection,
					createdAt: participation.group.createdAt,
					updatedAt: participation.group.updatedAt,
					semester: participation.group.semester,
					thesis: participation.group.thesis,
					skills: participation.group.groupRequiredSkills.map(
						(grs) => grs.skill,
					),
					responsibilities:
						participation.group.groupExpectedResponsibilities.map(
							(ger) => ger.responsibility,
						),
					members: participation.group.studentGroupParticipations
						.sort((a, b) => {
							// Sort by isLeader desc (leader first), then by fullName asc
							if (a.isLeader && !b.isLeader) return -1;
							if (!a.isLeader && b.isLeader) return 1;
							return a.student.user.fullName.localeCompare(
								b.student.user.fullName,
							);
						})
						.map((sgp) => ({
							...sgp.student,
							isLeader: sgp.isLeader,
						})),
					leader:
						participation.group.studentGroupParticipations.find(
							(sgp) => sgp.isLeader,
						)?.student ?? null,
					participation: {
						isLeader: participation.isLeader,
						semester: participation.semester,
					},
				}),
			);

			this.logger.log(
				`Found ${detailedGroupsWithParticipation.length} detailed groups for student ID: ${studentId}`,
			);

			return detailedGroupsWithParticipation;
		} catch (error) {
			this.handleError('fetching detailed groups by student ID', error);
		}
	}

	async findGroupMembers(groupId: string) {
		try {
			this.logger.log(`Finding members for group ID: ${groupId}`);

			// Removed caching for real-time data - group membership changes frequently
			const members = await this.prisma.studentGroupParticipation.findMany({
				where: {
					groupId: groupId,
				},
				select: {
					isLeader: true,
					student: {
						select: {
							userId: true,
							studentCode: true,
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
									phoneNumber: true,
									gender: true,
								},
							},
							major: {
								select: {
									id: true,
									name: true,
									code: true,
								},
							},
							studentSkills: {
								select: {
									level: true,
									skill: {
										select: {
											id: true,
											name: true,
											skillSet: {
												select: {
													id: true,
													name: true,
												},
											},
										},
									},
								},
							},
							studentExpectedResponsibilities: {
								select: {
									responsibility: {
										select: {
											id: true,
											name: true,
										},
									},
								},
							},
						},
					},
				},
				orderBy: [
					{ isLeader: 'desc' }, // Leaders first
					{ student: { user: { fullName: 'asc' } } },
				],
			});

			// Transform data
			const transformedMembers = members.map((member) => ({
				userId: member.student.userId,
				studentCode: member.student.studentCode,
				fullName: member.student.user.fullName,
				email: member.student.user.email,
				phoneNumber: member.student.user.phoneNumber,
				gender: member.student.user.gender,
				major: member.student.major,
				isLeader: member.isLeader,
				skills: member.student.studentSkills.map((ss) => ({
					...ss.skill,
					level: ss.level,
				})),
				responsibilities: member.student.studentExpectedResponsibilities.map(
					(ser) => ser.responsibility,
				),
			}));

			this.logger.log(
				`Found ${transformedMembers.length} members for group ID: ${groupId}`,
			);

			return transformedMembers;
		} catch (error) {
			this.handleError('fetching group members', error);
		}
	}

	async findGroupSkillsAndResponsibilities(groupId: string) {
		try {
			this.logger.log(
				`Finding skills and responsibilities for group ID: ${groupId}`,
			);

			// Keep cache for skills/responsibilities as they change less frequently
			const cacheKey = `${GroupService.CACHE_KEY}:${groupId}:skills-responsibilities`;
			const cached = await this.getCachedData<any>(cacheKey);
			if (cached) {
				this.logger.log('Found skills and responsibilities (from cache)');
				return cached;
			}

			const [groupSkills, groupResponsibilities] = await Promise.all([
				this.prisma.groupRequiredSkill.findMany({
					where: { groupId },
					select: {
						skill: {
							select: {
								id: true,
								name: true,
								skillSet: {
									select: {
										id: true,
										name: true,
									},
								},
							},
						},
					},
				}),
				this.prisma.groupExpectedResponsibility.findMany({
					where: { groupId },
					select: {
						responsibility: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				}),
			]);

			const result = {
				skills: groupSkills.map((gs) => gs.skill),
				responsibilities: groupResponsibilities.map((gr) => gr.responsibility),
			};

			// Cache for 5 minutes since skills/responsibilities change less frequently
			await this.setCachedData(cacheKey, result, 300000); // 5 minutes TTL

			this.logger.log(
				`Found ${result.skills.length} skills and ${result.responsibilities.length} responsibilities for group ID: ${groupId}`,
			);

			return result;
		} catch (error) {
			this.handleError('fetching group skills and responsibilities', error);
		}
	}

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

			// Clear relevant caches
			await this.clearGroupRelatedCaches(groupId, [studentId]);

			// Send email notifications to all group members
			await this.sendStudentAssignmentNotification(group, student);

			// Return the updated group with the new member
			const updatedGroup = await this.findOne(groupId);

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
			this.handleError('assigning student to group', error);
		}
	}

	// Email notification helper for student assignment
	private async sendStudentAssignmentNotification(
		group: any,
		assignedStudent: any,
	) {
		try {
			// Get all group members including the newly assigned student
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

			// Send email to the assigned student
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

			// Send email to all existing group members
			for (const member of groupMembers) {
				// Skip the newly assigned student (they already got their notification)
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
				throw new NotFoundException(`Group not found`);
			}

			if (!student) {
				throw new NotFoundException(`Student not found`);
			}

			if (!leaderParticipation) {
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

			// Check semester status - allow removal only in Preparing or Picking phases
			if (!['Preparing', 'Picking'].includes(group.semester.status)) {
				throw new ConflictException(
					`Cannot remove student from group. Semester status must be 'Preparing' or 'Picking', current status is '${group.semester.status}'`,
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

			// Clear relevant caches
			await this.clearGroupRelatedCaches(groupId, [studentId, leaderId]);

			// Send email notifications to all remaining group members and the removed student
			await this.sendStudentRemovalNotification(
				group,
				student,
				leaderParticipation,
				remainingMembers,
			);

			// Return the updated group
			const updatedGroup = await this.findOne(groupId);

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
			this.handleError('removing student from group', error);
		}
	}

	// Email notification helper for student removal
	private async sendStudentRemovalNotification(
		group: any,
		removedStudent: any,
		leaderParticipation: any,
		remainingMembers: any[],
	) {
		try {
			const removalDate = new Date().toLocaleDateString();
			const baseContext = {
				groupName: group.name,
				groupCode: group.code,
				semesterName: group.semester.name,
				removedStudentName: removedStudent.user.fullName,
				removedStudentEmail: removedStudent.user.email,
				leaderName: `Group Leader`,
				removalDate,
			};

			// Send email to the removed student
			if (removedStudent.user.email) {
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_GROUP_LEADER_CHANGE_NOTIFICATION, // Reuse existing email type or create new one
					{
						to: removedStudent.user.email,
						subject: `You have been removed from Group ${group.code}`,
						context: {
							...baseContext,
							recipientName: removedStudent.user.fullName,
							recipientType: 'removed_student',
						},
					},
				);
			}

			// Send email to all remaining group members
			for (const member of remainingMembers) {
				if (member.student.user.email) {
					await this.emailQueueService.sendEmail(
						EmailJobType.SEND_GROUP_LEADER_CHANGE_NOTIFICATION, // Reuse existing email type or create new one
						{
							to: member.student.user.email,
							subject: `Member removed from Group ${group.code}`,
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
				`Student removal notifications sent for group ${group.code}`,
			);
		} catch (emailError) {
			this.logger.warn(
				'Failed to send student removal notification emails',
				emailError,
			);
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

			// Check if student is the leader and if there are other members
			if (participation.isLeader) {
				if (group._count.studentGroupParticipations > 1) {
					throw new ConflictException(
						`Cannot leave group. As the group leader, you must transfer leadership to another member before leaving the group "${participation.group.name}" (${participation.group.code}). Use the change leader feature first.`,
					);
				}
				// If leader is the only member, they can leave (which effectively deletes the group)
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

			// If this is the last member (leader), delete the entire group
			if (group._count.studentGroupParticipations === 1) {
				await this.prisma.$transaction(async (prisma) => {
					// Delete all related records first
					await Promise.all([
						prisma.groupRequiredSkill.deleteMany({
							where: { groupId: groupId },
						}),
						prisma.groupExpectedResponsibility.deleteMany({
							where: { groupId: groupId },
						}),
						prisma.request.deleteMany({
							where: { groupId: groupId },
						}),
						prisma.studentGroupParticipation.deleteMany({
							where: { groupId: groupId },
						}),
					]);

					// Delete the group itself
					await prisma.group.delete({
						where: { id: groupId },
					});
				});

				this.logger.log(
					`Group "${group.name}" (${group.code}) was automatically deleted as the last member (leader) left`,
				);

				// Clear relevant caches
				await this.clearGroupRelatedCaches(groupId, [studentId]);

				return {
					success: true,
					message: `You have successfully left the group. Since you were the last member, group "${group.name}" (${group.code}) has been automatically deleted.`,
					groupDeleted: true,
					deletedGroup: {
						id: group.id,
						code: group.code,
						name: group.name,
						semester: group.semester,
					},
				};
			}

			// Otherwise, just remove the student from the group
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

			// Clear relevant caches
			await this.clearGroupRelatedCaches(groupId, [studentId]);

			// Send email notifications to remaining group members and the leaving student
			await this.sendStudentLeaveNotification(group, student, remainingMembers);

			// Return the updated group
			const updatedGroup = await this.findOne(groupId);

			return {
				success: true,
				message: `You have successfully left group "${group.name}" (${group.code}). Remaining ${remainingMembers.length} members have been notified.`,
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
			this.handleError('leaving group', error);
		}
	}

	// Email notification helper for student leaving group
	private async sendStudentLeaveNotification(
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

	async delete(groupId: string, leaderId: string) {
		try {
			this.logger.log(
				`Deleting group with ID: ${groupId} by leader: ${leaderId}`,
			);

			// Get group details with all necessary data for validation
			const [group, leaderParticipation] = await Promise.all([
				this.prisma.group.findUnique({
					where: { id: groupId },
					include: {
						semester: {
							select: {
								id: true,
								status: true,
								name: true,
								code: true,
							},
						},
						thesis: {
							select: {
								id: true,
							},
						},
						_count: {
							select: {
								studentGroupParticipations: true,
								submissions: true,
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
			]);

			// Validate group exists
			if (!group) {
				throw new NotFoundException(`Group not found`);
			}

			// Validate current user is the leader
			if (!leaderParticipation) {
				throw new NotFoundException(`Student is not a member of this group`);
			}

			if (!leaderParticipation.isLeader) {
				throw new ConflictException(
					`Access denied. Only the group leader can delete group "${leaderParticipation.group.name}" (${leaderParticipation.group.code})`,
				);
			}

			// Validate semester status - only allow deletion during PREPARING phase
			if (group.semester.status !== SemesterStatus.Preparing) {
				throw new ConflictException(
					`Cannot delete group. Groups can only be deleted during the PREPARING semester status. Current status is ${group.semester.status}`,
				);
			}

			// Validate group doesn't have assigned thesis
			if (group.thesis) {
				throw new ConflictException(
					`Cannot delete group. Group has an assigned thesis. Please remove the thesis assignment first or contact a moderator for assistance.`,
				);
			}

			// Validate group doesn't have any submissions
			if (group._count.submissions > 0) {
				throw new ConflictException(
					`Cannot delete group. Group has ${group._count.submissions} milestone submission(s). Groups with submissions cannot be deleted.`,
				);
			}

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
			const result = await this.prisma.$transaction(async (prisma) => {
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
			});
			this.logger.log(
				`Group "${result.name}" (${result.code}) successfully deleted by leader. ${groupMembers.length} members affected.`,
			);

			// Clear all relevant caches
			const affectedStudentIds = groupMembers.map((member) => member.studentId);
			await this.clearGroupRelatedCaches(groupId, affectedStudentIds);

			// Send email notifications to all group members
			await this.sendGroupDeletionNotification(
				result,
				group.semester,
				groupMembers,
				leaderParticipation,
			);

			return result;
		} catch (error) {
			this.handleError('deleting group', error);
		}
	}

	// Email notification helper for group deletion
	private async sendGroupDeletionNotification(
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
			// Check semester status - only allow picking during PICKING phase
			this.validateSemesterStatus(
				group.semester.status,
				[SemesterStatus.Picking],
				'pick thesis',
			);

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
			if (thesis.status !== 'Approved') {
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
			await this.prisma.$transaction(async (prisma) => {
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
			});
			this.logger.log(
				`Thesis "${thesis.vietnameseName}" successfully assigned to group "${group.name}" (${group.code}) by leader`,
			);

			// Clear relevant caches
			await this.clearGroupRelatedCaches(groupId, [leaderId]);

			// Send email notifications
			await this.sendThesisAssignmentNotification(
				group.id,
				thesis.id,
				'picked',
			);

			// Return the updated group with thesis information
			const completeGroup = await this.findOne(groupId);

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
			this.handleError('picking thesis for group', error);
		}
	}

	async unpickThesis(groupId: string, leaderId: string) {
		try {
			this.logger.log(
				`Group leader ${leaderId} is unpicking thesis for group ${groupId}`,
			);

			// Validate inputs and get required data
			const { group } = await this.validateGroupAndLeader(
				groupId,
				leaderId,
				'unpick thesis',
			);

			// Check semester status - only allow unpicking during PICKING phase
			this.validateSemesterStatus(
				group.semester.status as string,
				[SemesterStatus.Picking],
				'unpick thesis',
			);

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
			await this.prisma.$transaction(async (prisma) => {
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
			});

			this.logger.log(
				`Thesis "${thesisInfo.vietnameseName}" successfully removed from group "${group.name}" (${group.code}) by leader`,
			);

			// // Clear relevant caches
			await this.clearGroupRelatedCaches(groupId, [leaderId]);

			// Send email notifications
			await this.sendThesisAssignmentNotification(
				group.id,
				thesisInfo.id,
				'unpicked',
			);

			// Return the updated group without thesis
			const completeGroup = await this.findOne(groupId);

			return {
				success: true,
				message: `Thesis "${thesisInfo.vietnameseName}" has been successfully removed from group "${group.name}" (${group.code}). All group members and thesis lecturer have been notified.`,
				group: completeGroup,
				removedThesis: thesisInfo,
			};
		} catch (error) {
			this.handleError('unpicking thesis from group', error);
		}
	}

	// Public method for thesis assignment notification (can be called from thesis service)
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

	/**
	 * Get group details with semester for notification
	 */
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

	/**
	 * Get thesis details with lecturer for notification
	 */
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

	/**
	 * Get group members for notification
	 */
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

	/**
	 * Generate subject line for lecturer email
	 */
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

	/**
	 * Generate subject line for member email
	 */
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

	/**
	 * Send email notification to lecturer
	 */
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

	/**
	 * Send email notification to group member
	 */
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

	/**
	 * Create base context for email notifications
	 */
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

	/**
	 * Clear cache patterns related to group operations
	 * Only clear essential caches to avoid over-clearing
	 */
	private async clearGroupRelatedCaches(
		groupId: string,
		studentIds?: string[],
		clearAll = false, // Changed default to false
	): Promise<void> {
		const keysToDelete: string[] = [];

		// Only clear all groups cache if explicitly requested
		if (clearAll) {
			keysToDelete.push(`${GroupService.CACHE_KEY}:all`);
		}

		// Clear specific group caches
		keysToDelete.push(
			`${GroupService.CACHE_KEY}:${groupId}`,
			`${GroupService.CACHE_KEY}:${groupId}:skills-responsibilities`,
		);

		// Clear student-specific caches only if student IDs are provided
		if (studentIds?.length) {
			for (const studentId of studentIds) {
				keysToDelete.push(
					`cache:student:${studentId}:groups`,
					`cache:student:${studentId}:detailed-groups`,
				);
			}
		}

		await this.clearMultipleCache(keysToDelete);
	}

	/**
	 * Get standard group include options for detailed group queries
	 */
	private getGroupWithThesisIncludeOptions() {
		return {
			semester: {
				select: {
					id: true,
					name: true,
					code: true,
					status: true,
				},
			},
			thesis: {
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
			},
		};
	}

	/**
	 * Get standard participation include options
	 */
	private getParticipationIncludeOptions() {
		return {
			group: {
				select: {
					code: true,
					name: true,
				},
			},
		};
	}

	/**
	 * Validate group existence and leader permissions
	 */
	private async validateGroupAndLeader(
		groupId: string,
		leaderId: string,
		operation: string,
	) {
		const [group, leaderParticipation] = await Promise.all([
			this.prisma.group.findUnique({
				where: { id: groupId },
				include: this.getGroupWithThesisIncludeOptions(),
			}),
			this.prisma.studentGroupParticipation.findFirst({
				where: {
					studentId: leaderId,
					groupId: groupId,
				},
				include: this.getParticipationIncludeOptions(),
			}),
		]);

		if (!group) {
			throw new NotFoundException(`Group not found`);
		}

		if (!leaderParticipation) {
			throw new NotFoundException(`You are not a member of this group`);
		}

		if (!leaderParticipation.isLeader) {
			throw new ConflictException(
				`Access denied. Only the group leader can ${operation} for group "${leaderParticipation.group.name}" (${leaderParticipation.group.code})`,
			);
		}

		return { group, leaderParticipation };
	}

	/**
	 * Validate semester status for specific operations
	 */
	private validateSemesterStatus(
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
}
