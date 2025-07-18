import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateSubmissionDto, UpdateSubmissionDto } from '@/submissions/dto';

import { SemesterStatus } from '~/generated/prisma';

@Injectable()
export class SubmissionService {
	private readonly logger = new Logger(SubmissionService.name);

	private static readonly CACHE_KEY = 'cache:submission';

	// Reusable include objects to eliminate duplication
	private readonly basicGroupSelect = {
		id: true,
		code: true,
		name: true,
	};

	private readonly basicMilestoneSelect = {
		id: true,
		name: true,
		startDate: true,
		endDate: true,
	};

	private readonly userSelect = {
		id: true,
		fullName: true,
	};

	private readonly reviewerInclude = {
		select: {
			reviewerId: true,
			submissionId: true,
			reviewer: {
				select: {
					user: {
						select: this.userSelect,
					},
				},
			},
		},
	};

	private readonly basicReviewInclude = {
		select: {
			id: true,
			feedback: true,
			lecturer: {
				select: {
					user: {
						select: this.userSelect,
					},
				},
			},
		},
	};

	private readonly groupParticipationInclude = {
		group: {
			include: {
				semester: true,
			},
		},
	};

	// Common submission include objects
	private readonly basicSubmissionInclude = {
		group: {
			select: this.basicGroupSelect,
		},
		milestone: {
			select: this.basicMilestoneSelect,
		},
	};

	private readonly detailedSubmissionInclude = {
		group: {
			select: {
				...this.basicGroupSelect,
				semester: {
					select: {
						id: true,
						name: true,
						code: true,
						status: true,
					},
				},
			},
		},
		milestone: {
			select: this.basicMilestoneSelect,
		},
		assignmentReviews: {
			include: {
				reviewer: {
					select: {
						user: {
							select: this.userSelect,
						},
					},
				},
			},
		},
		reviews: {
			include: {
				lecturer: {
					select: {
						user: {
							select: this.userSelect,
						},
					},
				},
				checklist: {
					select: {
						id: true,
						name: true,
						description: true,
					},
				},
				reviewItems: {
					include: {
						checklistItem: {
							select: {
								id: true,
								name: true,
								description: true,
								isRequired: true,
							},
						},
					},
				},
			},
		},
	};

	private readonly listSubmissionInclude = {
		group: {
			select: {
				...this.basicGroupSelect,
				semester: {
					select: {
						id: true,
						name: true,
						code: true,
					},
				},
			},
		},
		milestone: {
			select: this.basicMilestoneSelect,
		},
		assignmentReviews: this.reviewerInclude,
		reviews: this.basicReviewInclude,
	};

	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	// Generic method to find group participation
	private async findGroupParticipation(
		userId: string,
		groupId: string,
		isLeader?: boolean,
	) {
		const where: any = {
			studentId: userId,
			groupId: groupId,
		};

		if (isLeader !== undefined) {
			where.isLeader = isLeader;
		}

		return this.prisma.studentGroupParticipation.findFirst({
			where,
			include: this.groupParticipationInclude,
		});
	}

	// Helper method to check if user is group leader
	private async validateGroupLeadership(
		userId: string,
		groupId: string,
	): Promise<void> {
		const participation = await this.findGroupParticipation(
			userId,
			groupId,
			true,
		);

		if (!participation) {
			throw new ForbiddenException(
				'Only group leaders can create or update submissions',
			);
		}
	}

	// Helper method to check if user is group member
	private async validateGroupMembership(
		userId: string,
		groupId: string,
	): Promise<void> {
		const participation = await this.findGroupParticipation(userId, groupId);

		if (!participation) {
			throw new ForbiddenException(
				'You are not a member of this group or the group does not exist',
			);
		}
	}

	// Helper method to check if user is admin or lecturer
	private async validateUserRole(userId: string): Promise<boolean> {
		const [admin, lecturer] = await Promise.all([
			this.prisma.admin.findUnique({
				where: { id: userId },
			}),
			this.prisma.lecturer.findUnique({
				where: { userId: userId },
			}),
		]);

		return !!(admin || lecturer);
	}

	// Generic method to find milestone with semester
	private async findMilestoneWithSemester(milestoneId: string) {
		return this.prisma.milestone.findUnique({
			where: { id: milestoneId },
			include: {
				semester: true,
			},
		});
	}

	// Helper method to validate submission timeline for CREATE operations
	private async validateCreateSubmissionTimeline(
		milestoneId: string,
	): Promise<void> {
		const milestone = await this.findMilestoneWithSemester(milestoneId);

		if (!milestone) {
			throw new NotFoundException('Milestone not found');
		}

		const now = new Date();

		// Check if submission creation is only allowed before startDate
		if (now >= milestone.startDate) {
			throw new ConflictException(
				`Submission creation is only allowed before the milestone start date. Start date: ${milestone.startDate.toISOString()}`,
			);
		}

		// Check if semester allows submissions
		if (milestone.semester.status !== SemesterStatus.Ongoing) {
			throw new ConflictException(
				`Submissions are only allowed during ongoing semesters. Current semester status: ${milestone.semester.status}`,
			);
		}
	}

	// Helper method to validate submission timeline for UPDATE operations
	private async validateUpdateSubmissionTimeline(
		milestoneId: string,
	): Promise<void> {
		const milestone = await this.findMilestoneWithSemester(milestoneId);

		if (!milestone) {
			throw new NotFoundException('Milestone not found');
		}

		const now = new Date();

		// Check if submission update is only allowed before endDate
		if (now >= milestone.endDate) {
			throw new ConflictException(
				`Submission updates are only allowed before the milestone end date. End date: ${milestone.endDate.toISOString()}`,
			);
		}

		// Check if semester allows submissions
		if (milestone.semester.status !== SemesterStatus.Ongoing) {
			throw new ConflictException(
				`Submissions are only allowed during ongoing semesters. Current semester status: ${milestone.semester.status}`,
			);
		}
	}
	// Helper method to validate document URLs
	private validateDocuments(documents: string[]): void {
		if (!documents || documents.length === 0) {
			return;
		}

		for (const doc of documents) {
			if (typeof doc !== 'string' || doc.trim() === '') {
				throw new ConflictException('All documents must be non-empty strings');
			}
		}
	}

	// Helper method to get submission creation window info
	async getSubmissionCreationWindowInfo(milestoneId: string): Promise<{
		isOpen: boolean;
		milestone: any;
		message: string;
	}> {
		const milestone = await this.findMilestoneWithSemester(milestoneId);

		if (!milestone) {
			return {
				isOpen: false,
				milestone: null,
				message: 'Milestone not found',
			};
		}

		const now = new Date();
		const startDate = new Date(milestone.startDate);

		if (now >= startDate) {
			return {
				isOpen: false,
				milestone,
				message: `Submission creation period has ended. Creation was only allowed before ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}`,
			};
		}

		if (milestone.semester.status !== SemesterStatus.Ongoing) {
			return {
				isOpen: false,
				milestone,
				message: `Submissions not allowed - semester status: ${milestone.semester.status}`,
			};
		}

		return {
			isOpen: true,
			milestone,
			message: `Submission creation is allowed until ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}`,
		};
	}

	// Helper method to get submission update window info
	async getSubmissionUpdateWindowInfo(milestoneId: string): Promise<{
		isOpen: boolean;
		milestone: any;
		message: string;
	}> {
		const milestone = await this.findMilestoneWithSemester(milestoneId);

		if (!milestone) {
			return {
				isOpen: false,
				milestone: null,
				message: 'Milestone not found',
			};
		}

		const now = new Date();
		const endDate = new Date(milestone.endDate);

		if (now >= endDate) {
			return {
				isOpen: false,
				milestone,
				message: `Submission update period has ended. Updates were only allowed before ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`,
			};
		}

		if (milestone.semester.status !== SemesterStatus.Ongoing) {
			return {
				isOpen: false,
				milestone,
				message: `Submissions not allowed - semester status: ${milestone.semester.status}`,
			};
		}

		return {
			isOpen: true,
			milestone,
			message: `Submission updates are allowed until ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`,
		};
	}

	// Helper method to get submission window info (kept for backward compatibility)
	async getSubmissionWindowInfo(milestoneId: string): Promise<{
		isOpen: boolean;
		milestone: any;
		message: string;
	}> {
		const milestone = await this.findMilestoneWithSemester(milestoneId);

		if (!milestone) {
			return {
				isOpen: false,
				milestone: null,
				message: 'Milestone not found',
			};
		}

		const now = new Date();
		const startDate = new Date(milestone.startDate);
		const endDate = new Date(milestone.endDate);

		if (now < startDate) {
			return {
				isOpen: false,
				milestone,
				message: `Submission creation period opens before ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}. Updates allowed until ${endDate.toLocaleDateString()}.`,
			};
		}

		if (now >= startDate && now < endDate) {
			return {
				isOpen: true,
				milestone,
				message: `Submission creation period has ended, but updates are still allowed until ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`,
			};
		}

		if (now >= endDate) {
			return {
				isOpen: false,
				milestone,
				message: `Submission period has completely ended on ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`,
			};
		}

		if (milestone.semester.status !== SemesterStatus.Ongoing) {
			return {
				isOpen: false,
				milestone,
				message: `Submissions not allowed - semester status: ${milestone.semester.status}`,
			};
		}

		return {
			isOpen: true,
			milestone,
			message: `Submission update period is open until ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`,
		};
	}

	// Helper method to validate group and milestone existence and relationship
	private async validateGroupAndMilestoneExistence(
		groupId: string,
		milestoneId: string,
	): Promise<{ group: any; milestone: any }> {
		const [group, milestone] = await Promise.all([
			this.prisma.group.findUnique({
				where: { id: groupId },
				include: { semester: true },
			}),
			this.prisma.milestone.findUnique({
				where: { id: milestoneId },
				include: { semester: true },
			}),
		]);

		if (!group) {
			throw new NotFoundException('Group not found');
		}

		if (!milestone) {
			throw new NotFoundException('Milestone not found');
		}

		if (group.semesterId !== milestone.semesterId) {
			throw new ConflictException(
				'Group and milestone must be in the same semester',
			);
		}

		return { group, milestone };
	}

	// Generic method to find submission by groupId and milestoneId
	private async findSubmissionByCompositeKey(
		groupId: string,
		milestoneId: string,
	) {
		return this.prisma.submission.findUnique({
			where: {
				groupId_milestoneId: {
					groupId,
					milestoneId,
				},
			},
		});
	}

	// Generic method to handle common error patterns
	private async executeWithErrorHandling<T>(
		operation: string,
		fn: () => Promise<T>,
	): Promise<T> {
		try {
			this.logger.log(operation);
			return await fn();
		} catch (error) {
			this.logger.error(`Error ${operation.toLowerCase()}`, error);
			throw error;
		}
	}

	private async validateCreateSubmissionData(
		groupId: string,
		milestoneId: string,
		documents?: string[],
		userId?: string,
	): Promise<void> {
		if (userId) {
			await this.validateGroupLeadership(userId, groupId);
		}

		await this.validateCreateSubmissionTimeline(milestoneId);
		await this.validateGroupAndMilestoneExistence(groupId, milestoneId);

		if (documents) {
			this.validateDocuments(documents);
		}
	}

	private async validateUpdateSubmissionData(
		groupId: string,
		milestoneId: string,
		documents?: string[],
		userId?: string,
	): Promise<void> {
		if (userId) {
			await this.validateGroupLeadership(userId, groupId);
		}

		await this.validateUpdateSubmissionTimeline(milestoneId);
		await this.validateGroupAndMilestoneExistence(groupId, milestoneId);

		if (documents) {
			this.validateDocuments(documents);
		}
	}

	async create(
		groupId: string,
		milestoneId: string,
		dto: CreateSubmissionDto,
		userId?: string,
	) {
		return this.executeWithErrorHandling(
			'Creating new submission',
			async () => {
				await this.validateCreateSubmissionData(
					groupId,
					milestoneId,
					dto.documents,
					userId,
				);

				const existingSubmission = await this.findSubmissionByCompositeKey(
					groupId,
					milestoneId,
				);

				if (!existingSubmission) {
					const submission = await this.prisma.submission.create({
						data: {
							groupId,
							milestoneId,
							documents: dto.documents,
							status: 'Submitted',
							createdAt: new Date(),
							updatedAt: new Date(),
						},
						include: this.basicSubmissionInclude,
					});

					this.logger.log(`Submission created with ID: ${submission.id}`);
					return submission;
				}

				const submission = await this.prisma.submission.update({
					where: {
						groupId_milestoneId: {
							groupId,
							milestoneId,
						},
					},
					data: {
						documents: dto.documents,
						status: 'Submitted',
						createdAt: new Date(),
						updatedAt: new Date(),
					},
					include: this.basicSubmissionInclude,
				});

				this.logger.log(`Submission created with ID: ${submission.id}`);

				return submission;
			},
		);
	}

	async findAll(userId?: string) {
		return this.executeWithErrorHandling(
			'Finding all submissions',
			async () => {
				if (userId) {
					const isAuthorized = await this.validateUserRole(userId);
					if (!isAuthorized) {
						throw new ForbiddenException(
							'Only admins and lecturers can view all submissions',
						);
					}
				}

				const submissions = await this.prisma.submission.findMany({
					include: this.listSubmissionInclude,
					orderBy: {
						createdAt: 'desc',
					},
				});

				this.logger.log(`Found ${submissions.length} submissions`);
				return submissions;
			},
		);
	}

	async getSubmissionsForReview(semesterId?: string, milestoneId?: string) {
		try {
			const where: any = {};

			if (semesterId) {
				where.milestone = {
					semesterId: semesterId,
				};
			}

			if (milestoneId) {
				if (where.milestone) {
					where.milestone = {
						...where.milestone,
						id: milestoneId,
					};
				} else {
					where.milestoneId = milestoneId;
				}
			}

			const submissions = await this.prisma.submission.findMany({
				where,
				include: {
					group: {
						select: {
							id: true,
							name: true,
							code: true,
							thesis: {
								select: {
									id: true,
									englishName: true,
									vietnameseName: true,
									abbreviation: true,
									description: true,
									status: true,
									lecturer: {
										select: {
											user: {
												select: {
													id: true,
													fullName: true,
													email: true,
												},
											},
											isModerator: true,
										},
									},
								},
							},
						},
					},
					milestone: {
						select: { id: true, name: true },
					},
					reviews: {
						select: {
							lecturer: {
								select: {
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

			const mappedSubmissions = submissions.map((submission) => {
				// Lấy thông tin thesis nếu có
				const thesis = submission.group.thesis
					? {
							id: submission.group.thesis.id,
							englishName: submission.group.thesis.englishName,
							vietnameseName: submission.group.thesis.vietnameseName,
							abbreviation: submission.group.thesis.abbreviation,
							description: submission.group.thesis.description,
							status: submission.group.thesis.status,
							supervisors: Array.isArray(submission.group.thesis.lecturer)
								? submission.group.thesis.lecturer.map((lect) => ({
										id: lect.user.id,
										fullName: lect.user.fullName,
										email: lect.user.email,
										isModerator: lect.isModerator,
									}))
								: submission.group.thesis.lecturer
									? [
											{
												id: submission.group.thesis.lecturer.user.id,
												fullName:
													submission.group.thesis.lecturer.user.fullName,
												email: submission.group.thesis.lecturer.user.email,
												isModerator:
													submission.group.thesis.lecturer.isModerator,
											},
										]
									: [],
						}
					: null;

				// Lấy danh sách lecturer review hiện tại
				const reviewLecturers = (submission.reviews || [])
					.map((review) => {
						if (review.lecturer && review.lecturer.user) {
							return {
								id: review.lecturer.user.id,
								fullName: review.lecturer.user.fullName,
								email: review.lecturer.user.email,
							};
						}
						return null;
					})
					.filter(Boolean);

				return {
					id: submission.id,
					status: submission.status,
					documents: submission.documents,
					createdAt: submission.createdAt,
					group: {
						id: submission.group.id,
						name: submission.group.name,
						code: submission.group.code,
					},
					milestone: submission.milestone,
					thesis,
					reviewLecturers,
				};
			});

			this.logger.log(`Fetched ${submissions.length} submissions for review`);
			this.logger.debug(`Submissions: ${JSON.stringify(submissions, null, 2)}`);

			return mappedSubmissions;
		} catch (error) {
			this.logger.error('Error fetching submissions for review', error);
			throw error;
		}
	}

	async findByGroupId(groupId: string, userId?: string) {
		return this.executeWithErrorHandling(
			`Finding submissions for group: ${groupId}`,
			async () => {
				if (userId) {
					await this.validateGroupMembership(userId, groupId);
				}

				const submissions = await this.prisma.submission.findMany({
					where: { groupId },
					include: {
						milestone: {
							select: this.basicMilestoneSelect,
						},
						assignmentReviews: this.reviewerInclude,
						reviews: this.basicReviewInclude,
					},
					orderBy: {
						createdAt: 'desc',
					},
				});

				this.logger.log(
					`Found ${submissions.length} submissions for group ${groupId}`,
				);
				return submissions;
			},
		);
	}

	async findOne(groupId: string, milestoneId: string, userId?: string) {
		return this.executeWithErrorHandling(
			`Finding submission for group: ${groupId}, milestone: ${milestoneId}`,
			async () => {
				if (userId) {
					await this.validateGroupMembership(userId, groupId);
				}

				const submission = await this.prisma.submission.findUnique({
					where: {
						groupId_milestoneId: {
							groupId,
							milestoneId,
						},
					},
					include: this.detailedSubmissionInclude,
				});

				if (!submission) {
					throw new NotFoundException(
						`Submission not found for group ${groupId} and milestone ${milestoneId}`,
					);
				}

				this.logger.log(`Found submission with ID: ${submission.id}`);
				return submission;
			},
		);
	}

	async update(
		groupId: string,
		milestoneId: string,
		updateSubmissionDto: UpdateSubmissionDto,
		userId?: string,
	) {
		return this.executeWithErrorHandling(
			`Updating submission for group: ${groupId}, milestone: ${milestoneId}`,
			async () => {
				await this.validateUpdateSubmissionData(
					groupId,
					milestoneId,
					updateSubmissionDto.documents,
					userId,
				);

				const existingSubmission = await this.findSubmissionByCompositeKey(
					groupId,
					milestoneId,
				);

				if (!existingSubmission) {
					throw new NotFoundException(
						`Submission not found for group ${groupId} and milestone ${milestoneId}`,
					);
				}

				const updateData: any = {
					updatedAt: new Date(),
				};

				if (updateSubmissionDto.documents !== undefined) {
					updateData.documents = updateSubmissionDto.documents;
				}

				const updatedSubmission = await this.prisma.submission.update({
					where: {
						groupId_milestoneId: {
							groupId,
							milestoneId,
						},
					},
					data: updateData,
					include: this.basicSubmissionInclude,
				});

				this.logger.log(`Submission updated with ID: ${updatedSubmission.id}`);

				return updatedSubmission;
			},
		);
	}
}
