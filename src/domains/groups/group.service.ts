import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { BaseCacheService } from '@/bases/base-cache.service';
import { ChangeLeaderDto, CreateGroupDto, UpdateGroupDto } from '@/groups/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';

import { EnrollmentStatus, SemesterStatus } from '~/generated/prisma';

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

	private async clearCacheWithPattern(pattern?: string): Promise<void> {
		try {
			if (pattern) {
				await this.cacheManager.del(pattern);
			} else {
				this.logger.warn('Cache reset not implemented for current store');
			}
		} catch (error) {
			this.logger.warn(`Cache clear error:`, error);
		}
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

			await this.clearCacheWithPattern(`${GroupService.CACHE_KEY}:all`);
			await this.clearCacheWithPattern(`cache:student:${userId}:groups`);
			await this.clearCacheWithPattern(
				`${GroupService.CACHE_KEY}:${result.id}:members`,
			);
			await this.clearCacheWithPattern(
				`${GroupService.CACHE_KEY}:${result.id}:skills-responsibilities`,
			);

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
			const cacheKey = `${GroupService.CACHE_KEY}:all`;
			const cachedGroups = await this.getCachedData<any[]>(cacheKey);
			if (cachedGroups) {
				this.logger.log(`Found ${cachedGroups.length} groups (from cache)`);
				return cachedGroups;
			}

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

			await this.setCachedData(cacheKey, transformedGroups);

			this.logger.log(`Found ${transformedGroups.length} groups`);

			return transformedGroups;
		} catch (error) {
			this.handleError('fetching groups', error);
		}
	}

	async findOne(id: string) {
		try {
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
				members: group.studentGroupParticipations.map((sgp) => ({
					...sgp.student,
					isLeader: sgp.isLeader,
				})),
				leader:
					group.studentGroupParticipations.find((sgp) => sgp.isLeader)
						?.student ?? null,
			};

			await this.setCachedData(cacheKey, transformedGroup);

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

			await this.clearCacheWithPattern(`${GroupService.CACHE_KEY}:all`);
			await this.clearCacheWithPattern(`${GroupService.CACHE_KEY}:${id}`);
			await this.clearCacheWithPattern(`cache:student:${userId}:groups`);
			await this.clearCacheWithPattern(
				`${GroupService.CACHE_KEY}:${id}:members`,
			);
			await this.clearCacheWithPattern(
				`${GroupService.CACHE_KEY}:${id}:skills-responsibilities`,
			);

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
			await this.clearCacheWithPattern(`${GroupService.CACHE_KEY}:all`);
			await this.clearCacheWithPattern(`${GroupService.CACHE_KEY}:${groupId}`);
			await this.clearCacheWithPattern(
				`cache:student:${currentLeaderId}:groups`,
			);
			await this.clearCacheWithPattern(
				`cache:student:${dto.newLeaderId}:groups`,
			);
			await this.clearCacheWithPattern(
				`${GroupService.CACHE_KEY}:${groupId}:members`,
			);

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

			// Check cache first
			const cacheKey = `cache:student:${studentId}:groups`;
			const cachedGroups = await this.getCachedData<any[]>(cacheKey);
			if (cachedGroups) {
				this.logger.log(
					`Found ${cachedGroups.length} groups for student (from cache)`,
				);
				return cachedGroups;
			}

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

			// Cache the result
			await this.setCachedData(cacheKey, groupsWithParticipation);

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

			// Check cache first
			const cacheKey = `cache:student:${studentId}:detailed-groups`;
			const cachedGroups = await this.getCachedData<any[]>(cacheKey);
			if (cachedGroups) {
				this.logger.log(
					`Found ${cachedGroups.length} detailed groups for student (from cache)`,
				);
				return cachedGroups;
			}

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
					members: participation.group.studentGroupParticipations.map(
						(sgp) => ({
							...sgp.student,
							isLeader: sgp.isLeader,
						}),
					),
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

			// Cache the result
			await this.setCachedData(cacheKey, detailedGroupsWithParticipation);

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

			// Check cache first
			const cacheKey = `${GroupService.CACHE_KEY}:${groupId}:members`;
			const cachedMembers = await this.getCachedData<any[]>(cacheKey);
			if (cachedMembers) {
				this.logger.log(
					`Found ${cachedMembers.length} members for group (from cache)`,
				);
				return cachedMembers;
			}

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

			// Cache the result
			await this.setCachedData(cacheKey, transformedMembers);

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

			// Check cache first
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

			// Cache the result
			await this.setCachedData(cacheKey, result);

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
			if (!['Preparing'].includes(group.semester.status)) {
				throw new ConflictException(
					`Cannot assign student to group. Semester status must be 'Preparing', current status is '${group.semester.status}'`,
				);
			}

			// Check group capacity (max 6 members per group)
			const maxMembersPerGroup = 6;
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
			await Promise.all([
				this.clearCacheWithPattern(`${GroupService.CACHE_KEY}:all`),
				this.clearCacheWithPattern(`${GroupService.CACHE_KEY}:${groupId}`),
				this.clearCacheWithPattern(`cache:student:${studentId}:groups`),
				this.clearCacheWithPattern(
					`cache:student:${studentId}:detailed-groups`,
				),
				this.clearCacheWithPattern(
					`${GroupService.CACHE_KEY}:${groupId}:members`,
				),
			]);

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
			const currentGroupSize = groupMembers.length + 1; // Include the newly assigned student

			const baseContext = {
				groupName: group.name,
				groupCode: group.code,
				semesterName: group.semester.name,
				targetStudentName: assignedStudent.user.fullName,
				targetStudentCode: assignedStudent.code,
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
				`Student "${student.user.fullName}" (${student.user.email}) successfully removed from group "${group.name}" (${group.code}) by leader`,
			);

			// Clear relevant caches
			await Promise.all([
				this.clearCacheWithPattern(`${GroupService.CACHE_KEY}:all`),
				this.clearCacheWithPattern(`${GroupService.CACHE_KEY}:${groupId}`),
				this.clearCacheWithPattern(`cache:student:${studentId}:groups`),
				this.clearCacheWithPattern(
					`cache:student:${studentId}:detailed-groups`,
				),
				this.clearCacheWithPattern(`cache:student:${leaderId}:groups`),
				this.clearCacheWithPattern(`cache:student:${leaderId}:detailed-groups`),
				this.clearCacheWithPattern(
					`${GroupService.CACHE_KEY}:${groupId}:members`,
				),
			]);

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
}
