import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CreateGroupDto, UpdateGroupDto } from '@/groups/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';

import { EnrollmentStatus, SemesterStatus } from '~/generated/prisma';

@Injectable()
export class GroupService {
	private readonly logger = new Logger(GroupService.name);

	constructor(private readonly prisma: PrismaService) {}

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

		if (missingSkillIds.length > 0) {
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
			// Get current semester from student's enrollment with status NotYet
			const currentSemester = await this.getStudentCurrentSemester(userId);

			// Validate semester status
			if (currentSemester.status !== SemesterStatus.Picking) {
				throw new ConflictException(
					`Cannot create group. Semester status must be ${SemesterStatus.Picking}, current status is ${currentSemester.status}`,
				);
			}

			const currentTotalGroups = await this.prisma.group.count({
				where: { semesterId: currentSemester.id },
			});

			if (currentSemester.maxGroup == null) {
				this.logger.warn(
					`maxGroup is not set for semester ${currentSemester.id}`,
				);
				throw new ConflictException(
					`Cannot create group. Maximum number of groups for this semester is not configured.`,
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

			// Validate that the student is not already in a group for the semester
			await this.validateStudentNotInAnyGroup(userId, currentSemester.id);

			// Validate skills and responsibilities if provided
			if (dto.skillIds && dto.skillIds.length > 0) {
				await this.validateSkills(dto.skillIds);
			}

			if (dto.responsibilityIds && dto.responsibilityIds.length > 0) {
				await this.validateResponsibilities(dto.responsibilityIds);
			}

			// Create group and add student as leader in a transaction
			const result = await this.prisma.$transaction(async (prisma) => {
				// Count existing groups in this semester to get the next sequence number
				const existingGroupsCount = await prisma.group.count({
					where: {
						semesterId: currentSemester.id,
						code: {
							startsWith: `${currentSemester.code}QN`,
						},
					},
				});

				// Generate next sequence number (starting from 1)
				const sequenceNumber = existingGroupsCount + 1;
				const groupCode = `${currentSemester.code}QN${sequenceNumber
					.toString()
					.padStart(3, '0')}`;

				// Create the group
				const group = await prisma.group.create({
					data: {
						code: groupCode,
						name: dto.name,
						projectDirection: dto.projectDirection,
						semesterId: currentSemester.id,
					},
				});

				// Add the student to the group as leader
				await prisma.studentGroupParticipation.create({
					data: {
						studentId: userId,
						groupId: group.id,
						semesterId: currentSemester.id,
						isLeader: true,
					},
				});

				// Create group required skills if provided
				if (dto.skillIds && dto.skillIds.length > 0) {
					const groupRequiredSkills = dto.skillIds.map((skillId) => ({
						groupId: group.id,
						skillId: skillId,
					}));

					await prisma.groupRequiredSkill.createMany({
						data: groupRequiredSkills,
					});
				}

				// Create group expected responsibilities if provided
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
			});

			this.logger.log(
				`Group "${result.name}" created with ID: ${result.id} by student ${userId} in semester ${currentSemester.name}`,
			);

			// Fetch the complete group data with all relationships
			const completeGroup = await this.findOne(result.id);

			return completeGroup;
		} catch (error) {
			this.logger.error('Error creating group', error);

			throw error;
		}
	}

	async findAll() {
		try {
			const groups = await this.prisma.group.findMany({
				include: {
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
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${groups.length} groups`);

			return groups;
		} catch (error) {
			this.logger.error('Error fetching groups', error);

			throw error;
		}
	}

	async findOne(id: string) {
		try {
			const group = await this.prisma.group.findUnique({
				where: { id },
				include: {
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

			this.logger.log(`Group found with ID: ${group.id}`);

			return group;
		} catch (error) {
			this.logger.error('Error fetching group', error);

			throw error;
		}
	}

	async update(id: string, userId: string, dto: UpdateGroupDto) {
		try {
			this.logger.log(`Updating group with ID: ${id}`);

			const existingGroup = await this.prisma.group.findUnique({
				where: { id },
			});

			if (!existingGroup) {
				throw new NotFoundException(`Group not found`);
			}

			// Check if user is the leader of the group
			await this.validateStudentIsLeader(userId, id);

			// Validate semester status for update
			await this.validateSemester(existingGroup.semesterId);

			// Validate skills and responsibilities if provided
			if (
				dto.skillIds &&
				Array.isArray(dto.skillIds) &&
				dto.skillIds.length > 0
			) {
				await this.validateSkills(dto.skillIds);
			}

			if (
				dto.responsibilityIds &&
				Array.isArray(dto.responsibilityIds) &&
				dto.responsibilityIds.length > 0
			) {
				await this.validateResponsibilities(dto.responsibilityIds);
			}

			// Update group and relationships in a transaction
			const result = await this.prisma.$transaction(async (prisma) => {
				// Update basic group information
				const group = await prisma.group.update({
					where: { id },
					data: {
						name: dto.name,
						projectDirection: dto.projectDirection,
					},
				});

				// Update group required skills if provided
				if (dto.skillIds !== undefined) {
					// Delete existing skills
					await prisma.groupRequiredSkill.deleteMany({
						where: { groupId: id },
					});

					// Create new skills if any
					if (Array.isArray(dto.skillIds) && dto.skillIds.length > 0) {
						const groupRequiredSkills = dto.skillIds.map((skillId) => ({
							groupId: id,
							skillId: skillId,
						}));

						await prisma.groupRequiredSkill.createMany({
							data: groupRequiredSkills,
						});
					}
				}

				// Update group expected responsibilities if provided
				if (dto.responsibilityIds !== undefined) {
					// Delete existing responsibilities
					await prisma.groupExpectedResponsibility.deleteMany({
						where: { groupId: id },
					});

					// Create new responsibilities if any
					if (
						Array.isArray(dto.responsibilityIds) &&
						dto.responsibilityIds.length > 0
					) {
						const groupExpectedResponsibilities = dto.responsibilityIds.map(
							(responsibilityId) => ({
								groupId: id,
								responsibilityId: responsibilityId,
							}),
						);

						await prisma.groupExpectedResponsibility.createMany({
							data: groupExpectedResponsibilities,
						});
					}
				}

				return group;
			});

			this.logger.log(`Group updated with ID: ${result.id}`);

			// Fetch the complete group data with all relationships
			const completeGroup = await this.findOne(result.id);

			return completeGroup;
		} catch (error) {
			this.logger.error('Error updating group', error);

			throw error;
		}
	}
}
