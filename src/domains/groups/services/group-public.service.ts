import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers';

@Injectable()
export class GroupPublicService {
	private readonly logger = new Logger(GroupPublicService.name);

	constructor(private readonly prisma: PrismaService) {}

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
			thesis: true,
			_count: {
				select: {
					studentGroupParticipations: true,
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
				take: 1,
			},
		};
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

	async findAll() {
		try {
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

			const transformedGroups = groups.map((group) => ({
				id: group.id,
				code: group.code,
				name: group.name,
				projectDirection: group.projectDirection,
				createdAt: group.createdAt,
				updatedAt: group.updatedAt,
				semester: group.semester,
				thesis: group.thesis,
				memberCount: group._count.studentGroupParticipations,
				leader: group.studentGroupParticipations[0] ?? null,
			}));

			this.logger.log(`Found ${transformedGroups.length} groups`);

			return transformedGroups;
		} catch (error) {
			this.logger.error('Error fetching groups', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
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

			this.logger.log(`Group found with ID: ${transformedGroup.id}`);

			return transformedGroup;
		} catch (error) {
			this.logger.error(`Error fetching group with ID ${id}`, error);
			throw error;
		}
	}

	async findDetailedByStudentId(studentId: string) {
		try {
			this.logger.log(`Finding detailed groups for student ID: ${studentId}`);

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
			this.logger.error(
				`Error finding detailed groups for student ID ${studentId}`,
				error,
			);

			throw error;
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
			this.logger.error(`Error finding members for group ID ${groupId}`, error);
			throw error;
		}
	}

	async findGroupSkillsAndResponsibilities(groupId: string) {
		try {
			this.logger.log(
				`Finding skills and responsibilities for group ID: ${groupId}`,
			);

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

			this.logger.log(
				`Found ${result.skills.length} skills and ${result.responsibilities.length} responsibilities for group ID: ${groupId}`,
			);

			return result;
		} catch (error) {
			this.logger.error(
				`Error finding skills and responsibilities for group ID ${groupId}`,
				error,
			);

			throw error;
		}
	}
}
