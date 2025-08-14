import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { CreateThesisApplicationDto } from '@/thesis-application/dtos';
import { ThesisApplicationService } from '@/thesis-application/services/thesis-application.service';

@Injectable()
export class ThesisApplicationStudentService {
	private readonly logger = new Logger(ThesisApplicationStudentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly thesisApplicationService: ThesisApplicationService,
	) {}

	async create(
		semesterId: string,
		userId: string,
		dto: CreateThesisApplicationDto,
	) {
		this.logger.log(
			`Creating thesis application for user ${userId}, group ${dto.groupId}, thesis ${dto.thesisId}`,
		);

		try {
			// Step 1: Fetch all required data in parallel
			const [semester, student, thesis] = await Promise.all([
				this.prisma.semester.findUnique({
					where: { id: semesterId },
				}),
				this.prisma.student.findUnique({
					where: { userId },
					include: {
						enrollments: {
							where: {
								semesterId: semesterId,
								status: 'NotYet',
							},
						},
					},
				}),
				this.prisma.thesis.findUnique({
					where: { id: dto.thesisId },
				}),
			]);

			// Step 2: Validate semester
			this.thesisApplicationService.validateSemesterStatus(
				semester,
				semesterId,
			);

			// Step 3: Validate student
			this.thesisApplicationService.validateStudent(
				student,
				userId,
				semesterId,
			);

			// Step 4: Validate thesis
			this.thesisApplicationService.validateThesis(
				thesis,
				dto.thesisId,
				semesterId,
			);

			// Step 5: Fetch and validate group with applications in parallel
			const [group, approvedApplications, existingApplication] =
				await Promise.all([
					this.prisma.group.findUnique({
						where: { id: dto.groupId },
						include: {
							studentGroupParticipations: {
								where: {
									studentId: userId,
									isLeader: true,
									semesterId: semesterId,
								},
							},
						},
					}),
					this.prisma.thesisApplication.findMany({
						where: {
							groupId: dto.groupId,
							status: 'Approved',
						},
						include: {
							thesis: {
								select: {
									id: true,
									englishName: true,
									vietnameseName: true,
								},
							},
						},
					}),
					this.prisma.thesisApplication.findUnique({
						where: {
							groupId_thesisId: {
								groupId: dto.groupId,
								thesisId: dto.thesisId,
							},
						},
					}),
				]);

			// Step 6: Validate group
			if (!group) {
				this.logger.warn(`Group with ID ${dto.groupId} not found`);
				throw new NotFoundException('Group not found');
			}

			if (group.studentGroupParticipations.length === 0) {
				this.logger.warn(
					`Student with ID ${userId} is not the leader of group ${dto.groupId} in semester ${semesterId}`,
				);
				throw new ForbiddenException('Only group leaders can apply for thesis');
			}

			if (group.semesterId !== semesterId) {
				this.logger.warn(
					`Group ${dto.groupId} is not in the target semester ${semesterId}`,
				);
				throw new ConflictException(
					'Group must be in the same semester as the application',
				);
			}

			if (group.thesisId) {
				this.logger.warn(`Group ${dto.groupId} already has thesis assigned`);
				throw new ConflictException('Group already has a thesis assigned');
			}

			// Step 7: Validate approved applications
			if (approvedApplications.length > 0) {
				const approvedApp = approvedApplications[0];
				this.logger.warn(
					`Group ${dto.groupId} already has approved application for thesis ${approvedApp.thesis.englishName}`,
				);
				throw new ConflictException(
					`Group already has an approved application for thesis: ${approvedApp.thesis.englishName}. A group can only have one approved thesis application.`,
				);
			}

			// Step 8: Handle existing application logic

			let thesisApplication;

			if (existingApplication) {
				if (
					existingApplication.status === 'Rejected' ||
					existingApplication.status === 'Cancelled'
				) {
					this.logger.log(
						`Creating new application for group ${dto.groupId} and thesis ${dto.thesisId} (previous was ${existingApplication.status})`,
					);

					await this.prisma.thesisApplication.delete({
						where: {
							groupId_thesisId: {
								groupId: dto.groupId,
								thesisId: dto.thesisId,
							},
						},
					});

					thesisApplication = await this.prisma.thesisApplication.create({
						data: {
							groupId: dto.groupId,
							thesisId: dto.thesisId,
							status: 'Pending',
						},
						include: this.thesisApplicationService.getApplicationInclude(),
					});
				} else {
					this.logger.warn(
						`Application already exists for group ${dto.groupId} and thesis ${dto.thesisId} with status ${existingApplication.status}`,
					);
					throw new ConflictException(
						`Application for this thesis already exists with status: ${existingApplication.status}`,
					);
				}
			} else {
				thesisApplication = await this.prisma.thesisApplication.create({
					data: {
						groupId: dto.groupId,
						thesisId: dto.thesisId,
						status: 'Pending',
					},
					include: this.thesisApplicationService.getApplicationInclude(),
				});
			}

			this.logger.log(
				`Thesis application ${existingApplication ? 'recreated' : 'created'} successfully for group ${dto.groupId} and thesis ${dto.thesisId}`,
			);
			this.logger.debug(
				`${existingApplication ? 'Recreated' : 'Created'} thesis application`,
				JSON.stringify(thesisApplication),
			);

			return thesisApplication;
		} catch (error) {
			this.logger.error(
				`Error creating thesis application for user ${userId}`,
				error,
			);
			throw error;
		}
	}

	async findAll(semesterId: string, groupId: string) {
		this.logger.log(
			`Finding thesis applications for semester ${semesterId}, group ${groupId}`,
		);

		try {
			// Fetch semester and group data in parallel
			const [semester, group] = await Promise.all([
				this.prisma.semester.findUnique({
					where: { id: semesterId },
				}),
				this.prisma.group.findUnique({
					where: { id: groupId },
					include: {
						studentGroupParticipations: {
							where: {
								semesterId: semesterId,
							},
						},
					},
				}),
			]);

			if (!semester) {
				this.logger.warn(`Semester with ID ${semesterId} not found`);
				throw new NotFoundException('Semester not found');
			}

			if (!group) {
				this.logger.warn(`Group with ID ${groupId} not found`);
				throw new NotFoundException('Group not found');
			}

			if (group.semesterId !== semesterId) {
				this.logger.warn(
					`Group ${groupId} is not in the target semester ${semesterId}`,
				);
				throw new ConflictException('Group must be in the specified semester');
			}

			const thesisApplications = await this.prisma.thesisApplication.findMany({
				where: {
					groupId: groupId,
				},
				include: {
					thesis: {
						include: {
							lecturer: {
								include: {
									user: {
										omit: { password: true },
									},
								},
							},
							thesisRequiredSkills: {
								include: {
									skill: {
										include: {
											skillSet: true,
										},
									},
								},
							},
						},
					},
					group: {
						include: {
							studentGroupParticipations: {
								include: {
									student: {
										include: {
											user: {
												omit: { password: true },
											},
										},
									},
								},
							},
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			});

			this.logger.log(
				`Found ${thesisApplications.length} thesis applications for group ${groupId}`,
			);
			this.logger.debug(
				'Thesis applications details',
				JSON.stringify(thesisApplications),
			);

			return thesisApplications;
		} catch (error) {
			this.logger.error(
				`Error finding thesis applications for semester ${semesterId} , group ${groupId}`,
				error,
			);
			throw error;
		}
	}

	async cancel(groupId: string, thesisId: string, userId: string) {
		this.logger.log(
			`Cancelling thesis application for group ${groupId}, thesis ${thesisId} by user ${userId}`,
		);

		try {
			const application = await this.prisma.thesisApplication.findUnique({
				where: {
					groupId_thesisId: {
						groupId: groupId,
						thesisId: thesisId,
					},
				},
				include: {
					group: {
						include: {
							studentGroupParticipations: {
								where: {
									studentId: userId,
									isLeader: true,
								},
							},
							semester: true,
						},
					},
					thesis: {
						include: {
							lecturer: {
								include: {
									user: {
										omit: { password: true },
									},
								},
							},
						},
					},
				},
			});

			if (!application) {
				this.logger.warn(
					`Thesis application for group ${groupId} and thesis ${thesisId} not found`,
				);
				throw new NotFoundException('Thesis application not found');
			}

			if (application.group.studentGroupParticipations.length === 0) {
				this.logger.warn(
					`Student with ID ${userId} is not the leader of group ${groupId}`,
				);
				throw new ForbiddenException(
					'Only group leaders can cancel thesis applications',
				);
			}

			if (application.status !== 'Pending') {
				this.logger.warn(
					`Cannot cancel thesis application for group ${groupId} and thesis ${thesisId} with status ${application.status}`,
				);
				throw new ConflictException(
					`Cannot cancel application with status: ${application.status}. Only pending applications can be cancelled.`,
				);
			}

			if (application.group.semester.status !== 'Picking') {
				this.logger.warn(
					`Cannot cancel application during ${application.group.semester.status} phase`,
				);
				throw new ConflictException(
					'Applications can only be cancelled during the Picking phase',
				);
			}

			const cancelledApplication = await this.prisma.thesisApplication.update({
				where: {
					groupId_thesisId: {
						groupId: groupId,
						thesisId: thesisId,
					},
				},
				data: {
					status: 'Cancelled',
				},
				include: this.thesisApplicationService.getApplicationInclude(),
			});

			this.logger.log(
				`Thesis application for group ${groupId} and thesis ${thesisId} cancelled successfully by user ${userId}`,
			);
			this.logger.debug(
				'Cancelled thesis application details',
				JSON.stringify(cancelledApplication),
			);

			return cancelledApplication;
		} catch (error) {
			this.logger.error(
				`Error cancelling thesis application for group ${groupId} and thesis ${thesisId} by user ${userId}`,
				error,
			);
			throw error;
		}
	}
}
