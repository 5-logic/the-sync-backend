import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { ChangeLeaderDto, CreateGroupDto, UpdateGroupDto } from '@/groups/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';

import { EnrollmentStatus, SemesterStatus } from '~/generated/prisma';

@Injectable()
export class GroupService {
	private readonly logger = new Logger(GroupService.name);
	private readonly CACHE_TTL = 5 * 60 * 1000;

	constructor(
		private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly emailQueueService: EmailQueueService,
	) {}

	private async getCachedData<T>(key: string): Promise<T | null> {
		try {
			const result = await this.cacheManager.get<T>(key);
			return result ?? null;
		} catch (error) {
			this.logger.warn(`Cache get error for key ${key}:`, error);
			return null;
		}
	}

	private async setCachedData(
		key: string,
		data: any,
		ttl?: number,
	): Promise<void> {
		try {
			await this.cacheManager.set(key, data, ttl ?? this.CACHE_TTL);
		} catch (error) {
			this.logger.warn(`Cache set error for key ${key}:`, error);
		}
	}

	private async clearCache(pattern?: string): Promise<void> {
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

	private async validateStudentIsLeader(userId: string, groupId: string) {
		const participation = await this.prisma.studentGroupParticipation.findFirst(
			{
				where: {
					studentId: userId,
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
			},
		);

		if (!participation) {
			throw new NotFoundException(`Student is not a member of this group`);
		}

		if (!participation.isLeader) {
			throw new ConflictException(
				`Access denied. Only the group leader can update group "${participation.group.name}" (${participation.group.code}) information`,
			);
		}
	}

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
	}

	private async validateSemester(semesterId: string) {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});

		if (!semester) {
			throw new NotFoundException(`Semester not found`);
		}

		if (semester.status !== SemesterStatus.Picking) {
			throw new ConflictException(
				`Cannot create/update group. Semester status must be ${SemesterStatus.Picking}, current status is ${semester.status}`,
			);
		}

		return semester;
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

	private async validateStudentNotInAnyGroup(
		userId: string,
		semesterId: string,
	) {
		const existingParticipation =
			await this.prisma.studentGroupParticipation.findFirst({
				where: {
					studentId: userId,
					semesterId: semesterId,
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
			});

		if (existingParticipation) {
			throw new ConflictException(
				`Student is already a member of group "${existingParticipation.group.name}" (${existingParticipation.group.code}) in this semester`,
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

			if (currentSemester.status !== SemesterStatus.Picking) {
				throw new ConflictException(
					`Cannot create group. Semester status must be ${SemesterStatus.Picking}, current status is ${currentSemester.status}`,
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
				const existingGroupsCount = await prisma.group.count({
					where: {
						semesterId: currentSemester.id,
						code: {
							startsWith: `${currentSemester.code}QN`,
						},
					},
				});

				const sequenceNumber = existingGroupsCount + 1;
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

			await this.clearCache('groups:all');
			await this.clearCache(`student:${userId}:groups`);
			await this.clearCache(`group:${result.id}:members`);
			await this.clearCache(`group:${result.id}:skills-responsibilities`);

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
			const cacheKey = 'groups:all';
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
			const cacheKey = `group:${id}`;
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

			if (existingGroup.semester.status !== SemesterStatus.Picking) {
				throw new ConflictException(
					`Cannot create/update group. Semester status must be ${SemesterStatus.Picking}, current status is ${existingGroup.semester.status}`,
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

			await this.clearCache('groups:all');
			await this.clearCache(`group:${id}`);
			await this.clearCache(`student:${userId}:groups`);
			await this.clearCache(`group:${id}:members`);
			await this.clearCache(`group:${id}:skills-responsibilities`);

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
			if (existingGroup.semester.status !== SemesterStatus.Picking) {
				throw new ConflictException(
					`Cannot change group leadership. Semester status must be ${SemesterStatus.Picking}, current status is ${existingGroup.semester.status}`,
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
			await this.clearCache('groups:all');
			await this.clearCache(`group:${groupId}`);
			await this.clearCache(`student:${currentLeaderId}:groups`);
			await this.clearCache(`student:${dto.newLeaderId}:groups`);
			await this.clearCache(`group:${groupId}:members`);

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
				previousLeaderName: previousLeaderUser?.user.fullName || 'Unknown',
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
			const cacheKey = `student:${studentId}:groups`;
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

	async findGroupMembers(groupId: string) {
		try {
			this.logger.log(`Finding members for group ID: ${groupId}`);

			// Check cache first
			const cacheKey = `group:${groupId}:members`;
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
			const cacheKey = `group:${groupId}:skills-responsibilities`;
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
}
