import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CreateGroupDto, UpdateGroupDto } from '@/groups/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';

import { EnrollmentStatus, SemesterStatus } from '~/generated/prisma';

@Injectable()
export class GroupService {
	private readonly logger = new Logger(GroupService.name);
	private readonly CACHE_TTL = 5 * 60 * 1000;

	constructor(
		private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {}

	private async getCachedData<T>(key: string): Promise<T | null> {
		try {
			const result = await this.cacheManager.get<T>(key);
			return result || null;
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
			await this.cacheManager.set(key, data, ttl || this.CACHE_TTL);
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
			await this.clearCache(`student:${userId}`);

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
				},
			},
			groupRequiredSkills: {
				include: {
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
				include: {
					responsibility: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
			studentGroupParticipations: {
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
				include: this.getGroupIncludeOptions(),
				orderBy: { createdAt: 'desc' },

				take: 1000,
			});

			await this.setCachedData(cacheKey, groups);

			this.logger.log(`Found ${groups.length} groups`);

			return groups;
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
				include: {
					...this.getGroupIncludeOptions(),
					thesis: {
						select: {
							id: true,
							englishName: true,
							vietnameseName: true,
							abbreviation: true,
							description: true,
							status: true,
						},
					},
				},
			});

			if (!group) {
				throw new NotFoundException(`Group not found`);
			}

			await this.setCachedData(cacheKey, group);

			this.logger.log(`Group found with ID: ${group.id}`);

			return group;
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
			await this.clearCache(`student:${userId}`);

			const completeGroup = await this.findOne(result.id);

			return completeGroup;
		} catch (error) {
			this.handleError('updating group', error);
		}
	}
}
