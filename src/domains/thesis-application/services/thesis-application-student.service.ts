import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailQueueService } from '@/queue/email';
import { EmailJobType } from '@/queue/email/enums';
import { CreateThesisApplicationDto } from '@/thesis-application/dtos';
import { ThesisApplicationService } from '@/thesis-application/services/thesis-application.service';

import { ThesisApplicationStatus } from '~/generated/prisma';

@Injectable()
export class ThesisApplicationStudentService {
	private readonly logger = new Logger(ThesisApplicationStudentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly thesisApplicationService: ThesisApplicationService,
		private readonly emailQueueService: EmailQueueService,
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

			this.thesisApplicationService.validateSemesterStatus(
				semester,
				semesterId,
			);

			this.thesisApplicationService.validateStudent(
				student,
				userId,
				semesterId,
			);

			this.thesisApplicationService.validateThesis(
				thesis,
				dto.thesisId,
				semesterId,
			);

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
							status: ThesisApplicationStatus.Approved,
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

			await this.thesisApplicationService.validateThesisAssignment(
				dto.groupId,
				dto.thesisId,
				group,
				approvedApplications,
			);

			const thesisApplication =
				await this.thesisApplicationService.handleExistingApplication(
					dto.groupId,
					dto.thesisId,
					existingApplication,
				);

			// Send email notification to supervisor
			await this.sendThesisApplicationNotification(thesisApplication);

			this.logger.log(
				`Thesis application ${existingApplication ? 'recreated' : 'created'} successfully for group ${dto.groupId} and thesis ${dto.thesisId}`,
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

	private async sendThesisApplicationNotification(thesisApplication: any) {
		try {
			this.logger.log(
				`Sending thesis application notification for group ${thesisApplication.groupId} and thesis ${thesisApplication.thesisId}`,
			);

			// Get comprehensive application data with all necessary information
			const applicationWithDetails =
				await this.prisma.thesisApplication.findUnique({
					where: {
						groupId_thesisId: {
							groupId: thesisApplication.groupId,
							thesisId: thesisApplication.thesisId,
						},
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
								semester: true,
							},
						},
						group: {
							include: {
								semester: true,
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
									where: {
										isLeader: true,
									},
								},
							},
						},
					},
				});

			if (!applicationWithDetails) {
				this.logger.warn('Application not found for notification');
				return;
			}

			const { thesis, group } = applicationWithDetails;
			const supervisor = thesis.lecturer;
			const leader = group.studentGroupParticipations[0]?.student;

			if (!supervisor?.user?.email) {
				this.logger.warn(
					`No email found for supervisor of thesis ${thesis.id}`,
				);
				return;
			}

			// Get total member count (including leader)
			const totalMembers = await this.prisma.studentGroupParticipation.count({
				where: {
					groupId: group.id,
					semesterId: group.semesterId,
				},
			});

			// Prepare email data
			const emailData = {
				to: supervisor.user.email,
				subject: `New Thesis Application - ${thesis.englishName}`,
				context: {
					lecturerName: supervisor.user.fullName,
					thesisEnglishName: thesis.englishName,
					thesisVietnameseName: thesis.vietnameseName,
					thesisAbbreviation: thesis.abbreviation,
					thesisDomain: thesis.domain,
					thesisOrientation: thesis.orientation,
					groupName: group.name,
					groupCode: group.code,
					leaderName: leader?.user?.fullName || 'Unknown',
					memberCount: totalMembers,
					applicationDate: applicationWithDetails.createdAt.toLocaleDateString(
						'en-US',
						{
							year: 'numeric',
							month: 'long',
							day: 'numeric',
						},
					),
					semesterName: group.semester.name,
				},
			};

			// Send email
			await this.emailQueueService.sendEmail(
				EmailJobType.SEND_THESIS_APPLICATION_NOTIFICATION,
				emailData,
			);

			this.logger.log(
				`Thesis application notification sent successfully to ${supervisor.user.email}`,
			);
		} catch (error) {
			this.logger.error('Error sending thesis application notification', error);
			// Don't throw error as it shouldn't block the main operation
		}
	}
}
