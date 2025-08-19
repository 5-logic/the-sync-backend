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

	async findGroupResponsibilities(groupId: string) {
		try {
			this.logger.log(`Finding responsibilities for group ID: ${groupId}`);

			// Get all members of the group with their responsibilities
			const groupMembers = await this.prisma.studentGroupParticipation.findMany(
				{
					where: {
						groupId: groupId,
					},
					select: {
						student: {
							select: {
								userId: true,
								studentResponsibilities: {
									select: {
										level: true,
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
				},
			);

			if (groupMembers.length === 0) {
				this.logger.warn(`No members found for group ID: ${groupId}`);
				return [];
			}

			// Get all unique responsibilities
			const allResponsibilities = new Map<
				string,
				{ id: string; name: string }
			>();
			const memberResponsibilities = new Map<string, Map<string, number>>();

			// Process each member's responsibilities
			groupMembers.forEach((member) => {
				const studentId = member.student.userId;
				const studentResponsibilityMap = new Map<string, number>();

				member.student.studentResponsibilities.forEach((sr) => {
					const { responsibility, level } = sr;
					allResponsibilities.set(responsibility.id, {
						id: responsibility.id,
						name: responsibility.name,
					});
					studentResponsibilityMap.set(responsibility.id, level);
				});

				memberResponsibilities.set(studentId, studentResponsibilityMap);
			});

			// Calculate average for each responsibility
			const averageResponsibilities = Array.from(
				allResponsibilities.values(),
			).map((responsibility) => {
				const levels = groupMembers
					.map((member) => {
						const studentResponsibilityMap = memberResponsibilities.get(
							member.student.userId,
						);
						return studentResponsibilityMap?.get(responsibility.id) || 0;
					})
					.filter((level) => level !== undefined);

				const average =
					levels.length > 0
						? levels.reduce((sum, level) => sum + level, 0) / levels.length
						: 0;

				return {
					responsibilityId: responsibility.id,
					responsibilityName: responsibility.name,
					averageLevel: Math.round(average * 100) / 100, // Round to 2 decimal places
				};
			});

			this.logger.log(
				`Found responsibilities for ${groupMembers.length} members in group ID: ${groupId}`,
			);

			return averageResponsibilities;
		} catch (error) {
			this.logger.error(
				`Error finding responsibilities for group ID ${groupId}`,
				error,
			);
			throw error;
		}
	}
}
