import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { EmailJobType, EmailQueueService } from '@/queue/email';

import { ThesisApplicationStatus, ThesisStatus } from '~/generated/prisma';

@Injectable()
export class ThesisApplicationService {
	private readonly logger = new Logger(ThesisApplicationService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly emailQueueService: EmailQueueService,
	) {}

	public getApplicationInclude() {
		return {
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
		};
	}

	public validateSemesterStatus(semester: any, semesterId: string) {
		if (!semester) {
			this.logger.warn(`Semester with ID ${semesterId} not found`);
			throw new NotFoundException('Semester not found');
		}

		if (semester.status !== 'Picking') {
			this.logger.warn(
				`Semester ${semesterId} is not in Picking phase. Current status: ${semester.status}`,
			);
			throw new ConflictException(
				'Thesis applications can only be submitted during the Picking phase',
			);
		}
	}

	public validateStudent(student: any, userId: string, semesterId: string) {
		if (!student) {
			this.logger.warn(`Student with ID ${userId} not found`);
			throw new NotFoundException('Student not found');
		}

		if (student.enrollments.length === 0) {
			this.logger.warn(
				`Student with ID ${userId} is not enrolled in semester ${semesterId} with NotYet status`,
			);
			throw new ForbiddenException(
				'You must be enrolled in this semester with NotYet status to apply for thesis',
			);
		}
	}

	public validateThesis(thesis: any, thesisId: string, semesterId: string) {
		if (!thesis) {
			this.logger.warn(`Thesis with ID ${thesisId} not found`);
			throw new NotFoundException('Thesis not found');
		}

		if (thesis.status !== ThesisStatus.Approved) {
			this.logger.warn(
				`Thesis ${thesisId} is not approved for application. Current status: ${thesis.status}`,
			);
			throw new ConflictException('Only approved theses can be applied for');
		}

		if (!thesis.isPublish) {
			this.logger.warn(`Thesis ${thesisId} is not published`);
			throw new ConflictException('Only published theses can be applied for');
		}

		if (thesis.semesterId !== semesterId) {
			this.logger.warn(
				`Thesis ${thesisId} is not in the target semester ${semesterId}`,
			);
			throw new ConflictException(
				'Thesis must be in the same semester as the application',
			);
		}

		if (thesis.groupId) {
			this.logger.warn(
				`Thesis ${thesisId} is already assigned to group ${thesis.groupId}`,
			);
			throw new ConflictException(
				'This thesis is already assigned to another group',
			);
		}
	}

	public getComprehensiveApplicationInclude() {
		return {
			thesis: {
				include: {
					lecturer: {
						include: {
							user: {
								omit: { password: true },
							},
						},
					},
					supervisions: {
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
					semester: true,
				},
			},
		};
	}

	public async validateLecturer(lecturerId: string) {
		const lecturer = await this.prisma.lecturer.findUnique({
			where: { userId: lecturerId },
		});

		if (!lecturer) {
			this.logger.warn(`Lecturer with ID ${lecturerId} not found`);
			throw new NotFoundException('Lecturer not found');
		}

		return lecturer;
	}

	async validateThesisV2(thesisId: string) {
		const thesis = await this.prisma.thesis.findUnique({
			where: { id: thesisId },
		});

		if (!thesis) {
			this.logger.warn(`Thesis with ID ${thesisId} not found`);
			throw new NotFoundException('Thesis not found');
		}

		return thesis;
	}

	public buildSupervisedThesesQuery(lecturerId: string, semesterId?: string) {
		const thesesWhere: any = {
			supervisions: {
				some: {
					lecturerId: lecturerId,
				},
			},
		};

		if (semesterId) {
			thesesWhere.semesterId = semesterId;
		}

		return thesesWhere;
	}

	async validateSupervision(lecturerId: string, thesisId: string) {
		const supervision = await this.prisma.supervision.findUnique({
			where: {
				thesisId_lecturerId: {
					thesisId: thesisId,
					lecturerId: lecturerId,
				},
			},
		});

		if (!supervision) {
			this.logger.warn(
				`Lecturer ${lecturerId} does not supervise thesis ${thesisId}`,
			);
			throw new ForbiddenException(
				'You are not authorized to update this thesis application',
			);
		}

		return supervision;
	}

	async validateApplication(groupId: string, thesisId: string) {
		const application = await this.prisma.thesisApplication.findUnique({
			where: {
				groupId_thesisId: {
					groupId: groupId,
					thesisId: thesisId,
				},
			},
		});

		if (!application) {
			this.logger.warn(
				`Application not found for group ${groupId} and thesis ${thesisId}`,
			);
			throw new NotFoundException('Thesis application not found');
		}

		return application;
	}

	async validateThesisAssignment(
		groupId: string,
		thesisId: string,
		group: any,
		approvedApplications: any[],
	): Promise<void> {
		if (approvedApplications.length > 0) {
			await this.handleExistingApprovedApplication(
				groupId,
				thesisId,
				group,
				approvedApplications[0],
			);
		}

		if (approvedApplications.length === 0 && group.thesisId) {
			this.handleThesisAssignmentConflict(
				groupId,
				thesisId,
				group.thesisId as string,
			);
		}
	}

	async handleExistingApprovedApplication(
		groupId: string,
		thesisId: string,
		group: any,
		approvedApp: any,
	): Promise<void> {
		if (approvedApp.thesis.id === thesisId) {
			this.logger.warn(
				`Group ${groupId} already has approved application for thesis ${approvedApp.thesis.englishName}`,
			);
			throw new ConflictException(
				`Group already has an approved application for this thesis: ${approvedApp.thesis.englishName}`,
			);
		}

		if (group.thesisId && group.thesisId !== thesisId) {
			this.logger.warn(
				`Group ${groupId} already has thesis ${group.thesisId} assigned but trying to apply for different thesis ${thesisId}`,
			);
			throw new ConflictException(
				'Group already has a thesis assigned. Cannot apply for a different thesis.',
			);
		}

		await this.cancelApprovedApplication(groupId, approvedApp);
	}

	async cancelApprovedApplication(
		groupId: string,
		approvedApp: any,
	): Promise<void> {
		this.logger.log(
			`Group ${groupId} has approved application for thesis ${approvedApp.thesis.englishName}. Cancelling it to apply for new thesis`,
		);

		await this.prisma.$transaction(async (tx) => {
			await tx.thesisApplication.update({
				where: {
					groupId_thesisId: {
						groupId: groupId,
						thesisId: approvedApp.thesis.id,
					},
				},
				data: {
					status: 'Cancelled',
					updatedAt: new Date(),
				},
			});

			await this.removeBidirectionalThesisAssignment(
				tx,
				groupId,
				approvedApp.thesis.id as string,
			);
		});

		this.logger.log(
			`Successfully cancelled approved application for thesis ${approvedApp.thesis.englishName} to allow new application`,
		);
	}

	async removeBidirectionalThesisAssignment(
		tx: any,
		groupId: string,
		thesisId: string,
	): Promise<void> {
		const [groupCheck, thesisCheck] = await Promise.all([
			tx.group.findUnique({
				where: { id: groupId },
				select: { thesisId: true },
			}),
			tx.thesis.findUnique({
				where: { id: thesisId },
				select: { groupId: true },
			}),
		]);

		if (groupCheck?.thesisId === thesisId && thesisCheck?.groupId === groupId) {
			await Promise.all([
				tx.group.update({
					where: { id: groupId },
					data: { thesisId: null },
				}),
				tx.thesis.update({
					where: { id: thesisId },
					data: { groupId: null },
				}),
			]);

			this.logger.log(
				`Removed bidirectional thesis assignment between group ${groupId} and thesis ${thesisId}`,
			);
		}
	}

	public handleThesisAssignmentConflict(
		groupId: string,
		requestedThesisId: string,
		assignedThesisId: string,
	): void {
		const isSameThesis = assignedThesisId === requestedThesisId;

		this.logger.warn(
			`Group ${groupId} has thesis ${assignedThesisId} assigned but trying to apply for ${isSameThesis ? 'same' : 'different'} thesis ${requestedThesisId}`,
		);

		const errorMessage = isSameThesis
			? 'Group already has this thesis assigned'
			: 'Group already has a thesis assigned. Cannot apply for a different thesis.';

		throw new ConflictException(errorMessage);
	}

	async handleExistingApplication(
		groupId: string,
		thesisId: string,
		existingApplication: any,
	): Promise<any> {
		if (existingApplication) {
			if (
				existingApplication.status === 'Rejected' ||
				existingApplication.status === 'Cancelled'
			) {
				return await this.recreateApplication(
					groupId,
					thesisId,
					existingApplication.status as string,
				);
			} else {
				this.logger.warn(
					`Application already exists for group ${groupId} and thesis ${thesisId} with status ${existingApplication.status}`,
				);
				throw new ConflictException(
					`Application for this thesis already exists with status: ${existingApplication.status}`,
				);
			}
		}

		return await this.createNewApplication(groupId, thesisId);
	}

	async recreateApplication(
		groupId: string,
		thesisId: string,
		previousStatus: string,
	): Promise<any> {
		this.logger.log(
			`Creating new application for group ${groupId} and thesis ${thesisId} (previous was ${previousStatus})`,
		);

		await this.prisma.thesisApplication.delete({
			where: {
				groupId_thesisId: {
					groupId: groupId,
					thesisId: thesisId,
				},
			},
		});

		return await this.createNewApplication(groupId, thesisId);
	}

	async createNewApplication(groupId: string, thesisId: string): Promise<any> {
		return await this.prisma.thesisApplication.create({
			data: {
				groupId: groupId,
				thesisId: thesisId,
				status: 'Pending',
			},
			include: this.getApplicationInclude(),
		});
	}

	async validateGroupCanBeApproved(groupId: string, thesisId: string) {
		const existingApprovedApplications =
			await this.prisma.thesisApplication.findMany({
				where: {
					groupId: groupId,
					status: ThesisApplicationStatus.Approved,
					thesisId: { not: thesisId },
				},
				include: {
					thesis: {
						select: {
							id: true,
							englishName: true,
						},
					},
				},
			});

		if (existingApprovedApplications.length > 0) {
			const approvedThesis = existingApprovedApplications[0];
			this.logger.warn(
				`Group ${groupId} already has approved application for thesis ${approvedThesis.thesis.englishName}`,
			);
			throw new ConflictException(
				`Group already has an approved application for thesis: ${approvedThesis.thesis.englishName}. Cannot approve multiple applications for the same group.`,
			);
		}
	}

	async validateGroupCanBeApprovedInTransaction(
		tx: any,
		groupId: string,
		thesisId: string,
	) {
		const existingApprovedApplications = await tx.thesisApplication.findMany({
			where: {
				groupId: groupId,
				status: ThesisApplicationStatus.Approved,
				thesisId: { not: thesisId },
			},
		});

		if (existingApprovedApplications.length > 0) {
			throw new ConflictException(
				'Another application for this group has been approved concurrently. Cannot approve multiple applications.',
			);
		}
	}

	async handleApprovalProcess(tx: any, groupId: string, thesisId: string) {
		await Promise.all([
			tx.group.update({
				where: { id: groupId },
				data: { thesisId: thesisId },
			}),
			tx.thesis.update({
				where: { id: thesisId },
				data: { groupId: groupId },
			}),
		]);

		this.logger.log(
			`Successfully assigned group ${groupId} to thesis ${thesisId} (bidirectional)`,
		);

		// Get group members and thesis details for email notification
		const groupWithDetails = await tx.group.findUnique({
			where: { id: groupId },
			include: {
				studentGroupParticipations: {
					include: {
						student: {
							include: {
								user: {
									select: {
										email: true,
										firstName: true,
										lastName: true,
									},
								},
							},
						},
					},
				},
				thesis: {
					include: {
						supervisions: {
							include: {
								lecturer: {
									include: {
										user: {
											select: {
												firstName: true,
												lastName: true,
											},
										},
									},
								},
							},
						},
						semester: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		// Send approval notification emails to all group members
		if (groupWithDetails) {
			const emailPromises = groupWithDetails.studentGroupParticipations.map(
				(participation) => {
					const student = participation.student;
					const thesis = groupWithDetails.thesis;

					// Get all supervisors names
					const supervisorNames = thesis.supervisions
						.map(
							(supervision) =>
								`${supervision.lecturer.user.firstName} ${supervision.lecturer.user.lastName}`,
						)
						.join(', ');

					return this.emailQueueService.sendEmail(
						EmailJobType.SEND_THESIS_APPLICATION_APPROVAL_NOTIFICATION,
						{
							to: student.user.email,
							subject: `🎉 Thesis Application Approved - ${thesis.englishName}`,
							context: {
								studentName: `${student.user.firstName} ${student.user.lastName}`,
								groupName: groupWithDetails.name,
								groupCode: groupWithDetails.code,
								thesisEnglishName: thesis.englishName,
								thesisVietnameseName: thesis.vietnameseName,
								thesisAbbreviation: thesis.abbreviation,
								supervisorName: supervisorNames,
								semesterName: thesis.semester.name,
								approvalDate: new Date().toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								}),
							},
						},
					);
				},
			);

			await Promise.all(emailPromises);

			this.logger.log(
				`Sent thesis approval notifications to ${groupWithDetails.studentGroupParticipations.length} group members`,
			);
		}

		const otherApplications = await tx.thesisApplication.findMany({
			where: {
				groupId: groupId,
				thesisId: { not: thesisId },
				status: 'Pending',
			},
		});

		if (otherApplications.length > 0) {
			const cancellationPromises = otherApplications.map((app) =>
				tx.thesisApplication.update({
					where: {
						groupId_thesisId: {
							groupId: app.groupId,
							thesisId: app.thesisId,
						},
					},
					data: {
						status: 'Cancelled',
						updatedAt: new Date(),
					},
				}),
			);

			await Promise.all(cancellationPromises);

			this.logger.log(
				`Auto-cancelled ${otherApplications.length} other applications for group ${groupId}`,
			);
		}

		const competingApplications = await tx.thesisApplication.findMany({
			where: {
				thesisId: thesisId,
				groupId: { not: groupId },
				status: 'Pending',
			},
		});

		if (competingApplications.length > 0) {
			const rejectionPromises = competingApplications.map((app) =>
				tx.thesisApplication.update({
					where: {
						groupId_thesisId: {
							groupId: app.groupId,
							thesisId: app.thesisId,
						},
					},
					data: {
						status: 'Rejected',
						updatedAt: new Date(),
					},
				}),
			);

			await Promise.all(rejectionPromises);

			this.logger.log(
				`Auto-rejected ${competingApplications.length} competing applications for thesis ${thesisId}`,
			);
		}
	}

	async handleRejectionProcess(tx: any, groupId: string, thesisId: string) {
		const [group, thesis] = await Promise.all([
			tx.group.findUnique({
				where: { id: groupId },
				select: { thesisId: true },
			}),
			tx.thesis.findUnique({
				where: { id: thesisId },
				select: { groupId: true },
			}),
		]);

		if (group?.thesisId === thesisId && thesis?.groupId === groupId) {
			await Promise.all([
				tx.group.update({
					where: { id: groupId },
					data: { thesisId: null },
				}),
				tx.thesis.update({
					where: { id: thesisId },
					data: { groupId: null },
				}),
			]);

			this.logger.log(
				`Removed bidirectional thesis assignment between group ${groupId} and thesis ${thesisId} due to rejection`,
			);
		}
	}
}
