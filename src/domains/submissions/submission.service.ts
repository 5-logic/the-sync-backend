import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { BaseCacheService } from '@/domains/bases/base-cache.service';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateSubmissionDto, UpdateSubmissionDto } from '@/submissions/dto';

import { SemesterStatus } from '~/generated/prisma';

@Injectable()
export class SubmissionService extends BaseCacheService {
	private static readonly CACHE_KEY = 'cache:submission';

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) cacheManager: Cache,
	) {
		super(cacheManager, SubmissionService.name);
	}

	// Helper method to check if user is group leader
	private async validateGroupLeadership(
		userId: string,
		groupId: string,
	): Promise<void> {
		const participation = await this.prisma.studentGroupParticipation.findFirst(
			{
				where: {
					studentId: userId,
					groupId: groupId,
					isLeader: true,
				},
				include: {
					group: {
						include: {
							semester: true,
						},
					},
				},
			},
		);

		if (!participation) {
			throw new ForbiddenException(
				'Only group leaders can create or update submissions',
			);
		}

		return;
	}

	// Helper method to check if user is group member
	private async validateGroupMembership(
		userId: string,
		groupId: string,
	): Promise<void> {
		const participation = await this.prisma.studentGroupParticipation.findFirst(
			{
				where: {
					studentId: userId,
					groupId: groupId,
				},
				include: {
					group: {
						include: {
							semester: true,
						},
					},
				},
			},
		);

		if (!participation) {
			throw new ForbiddenException(
				'You are not a member of this group or the group does not exist',
			);
		}

		return;
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

	// Helper method to validate submission timeline
	private async validateSubmissionTimeline(milestoneId: string): Promise<void> {
		const milestone = await this.prisma.milestone.findUnique({
			where: { id: milestoneId },
			include: {
				semester: true,
			},
		});

		if (!milestone) {
			throw new NotFoundException('Milestone not found');
		}

		const now = new Date();

		// Check if submission period has not started yet
		if (now < milestone.startDate) {
			throw new ConflictException(
				`Submission period has not started for this milestone. Submissions open on ${milestone.startDate.toISOString()}`,
			);
		}

		// Check if submission period has ended
		if (now > milestone.endDate) {
			throw new ConflictException(
				`Submission period has ended for this milestone. Deadline was ${milestone.endDate.toISOString()}`,
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

	// Helper method to get submission window info
	async getSubmissionWindowInfo(milestoneId: string): Promise<{
		isOpen: boolean;
		milestone: any;
		message: string;
	}> {
		const milestone = await this.prisma.milestone.findUnique({
			where: { id: milestoneId },
			include: {
				semester: true,
			},
		});

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
				message: `Submission period opens on ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}`,
			};
		}

		if (now > endDate) {
			return {
				isOpen: false,
				milestone,
				message: `Submission period closed on ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`,
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
			message: `Submission period is open until ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`,
		};
	}

	async create(
		groupId: string,
		milestoneId: string,
		dto: CreateSubmissionDto,
		userId?: string,
	) {
		this.logger.log('Creating new submission');

		// If userId provided, validate group leadership
		if (userId) {
			await this.validateGroupLeadership(userId, groupId);
		}

		// Validate submission timeline
		await this.validateSubmissionTimeline(milestoneId);

		// Check if submission already exists
		const existingSubmission = await this.prisma.submission.findUnique({
			where: {
				groupId_milestoneId: {
					groupId: groupId,
					milestoneId: milestoneId,
				},
			},
		});

		if (existingSubmission) {
			throw new ConflictException(
				'Submission already exists for this group and milestone',
			);
		}

		// Validate group and milestone exist
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

		// Ensure group and milestone are in the same semester
		if (group.semesterId !== milestone.semesterId) {
			throw new ConflictException(
				'Group and milestone must be in the same semester',
			);
		}

		// Validate documents if provided
		if (dto.documents) {
			this.validateDocuments(dto.documents);
		}

		const submission = await this.prisma.submission.create({
			data: {
				groupId: groupId,
				milestoneId: milestoneId,
				documents: dto.documents || [],
			},
			include: {
				group: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},
				milestone: {
					select: {
						id: true,
						name: true,
						startDate: true,
						endDate: true,
					},
				},
			},
		});

		this.logger.log(`Submission created with ID: ${submission.id}`);

		// Clear group submissions cache only - no need to clear all cache
		await this.clearCache(`${SubmissionService.CACHE_KEY}:group:${groupId}`);

		return submission;
	}

	async findAll(userId?: string) {
		this.logger.log('Finding all submissions');

		// If userId provided, check if admin or lecturer
		if (userId) {
			const isAuthorized = await this.validateUserRole(userId);
			if (!isAuthorized) {
				throw new ForbiddenException(
					'Only admins and lecturers can view all submissions',
				);
			}
		}

		// No cache for admin/lecturer queries as they need real-time data
		const submissions = await this.prisma.submission.findMany({
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
								code: true,
							},
						},
					},
				},
				milestone: {
					select: {
						id: true,
						name: true,
						startDate: true,
						endDate: true,
					},
				},
				assignmentReviews: {
					select: {
						reviewerId: true,
						submissionId: true,
						reviewer: {
							select: {
								user: {
									select: {
										fullName: true,
									},
								},
							},
						},
					},
				},
				reviews: {
					select: {
						id: true,
						feedback: true,
						lecturer: {
							select: {
								user: {
									select: {
										fullName: true,
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

		this.logger.log(`Found ${submissions.length} submissions`);
		return submissions;
	}

	async findByGroupId(groupId: string, userId?: string) {
		this.logger.log(`Finding submissions for group: ${groupId}`);

		// If userId provided, validate group membership
		if (userId) {
			await this.validateGroupMembership(userId, groupId);
		}

		// Cache for group submissions as they are accessed frequently by students
		const cacheKey = `${SubmissionService.CACHE_KEY}:group:${groupId}`;
		const cached = await this.getCachedData<any[]>(cacheKey);

		if (cached) {
			this.logger.log('Returning cached group submissions');
			return cached;
		}

		const submissions = await this.prisma.submission.findMany({
			where: { groupId },
			include: {
				milestone: {
					select: {
						id: true,
						name: true,
						startDate: true,
						endDate: true,
					},
				},
				assignmentReviews: {
					select: {
						reviewerId: true,
						submissionId: true,
						reviewer: {
							select: {
								user: {
									select: {
										fullName: true,
									},
								},
							},
						},
					},
				},
				reviews: {
					select: {
						id: true,
						feedback: true,
						lecturer: {
							select: {
								user: {
									select: {
										fullName: true,
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

		// Cache with shorter TTL since submissions can be updated frequently
		await this.setCachedData(cacheKey, submissions, 300000); // 5 minutes

		this.logger.log(
			`Found ${submissions.length} submissions for group ${groupId}`,
		);
		return submissions;
	}

	async findOne(groupId: string, milestoneId: string, userId?: string) {
		this.logger.log(
			`Finding submission for group: ${groupId}, milestone: ${milestoneId}`,
		);

		// If userId provided, validate group membership
		if (userId) {
			await this.validateGroupMembership(userId, groupId);
		}

		// No cache for individual submissions as they contain detailed review data
		// that should be real-time for students and lecturers
		const submission = await this.prisma.submission.findUnique({
			where: {
				groupId_milestoneId: {
					groupId,
					milestoneId,
				},
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
								code: true,
								status: true,
							},
						},
					},
				},
				milestone: {
					select: {
						id: true,
						name: true,
						startDate: true,
						endDate: true,
					},
				},
				assignmentReviews: {
					include: {
						reviewer: {
							select: {
								user: {
									select: {
										id: true,
										fullName: true,
									},
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
									select: {
										id: true,
										fullName: true,
									},
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
										acceptance: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!submission) {
			throw new NotFoundException(
				`Submission not found for group ${groupId} and milestone ${milestoneId}`,
			);
		}

		this.logger.log(`Found submission with ID: ${submission.id}`);
		return submission;
	}

	async update(
		groupId: string,
		milestoneId: string,
		updateSubmissionDto: UpdateSubmissionDto,
		userId?: string,
	) {
		this.logger.log(
			`Updating submission for group: ${groupId}, milestone: ${milestoneId}`,
		);

		// If userId provided, validate group leadership
		if (userId) {
			await this.validateGroupLeadership(userId, groupId);
		}

		// Validate submission timeline for updates
		await this.validateSubmissionTimeline(milestoneId);

		// Check if submission exists
		const existingSubmission = await this.prisma.submission.findUnique({
			where: {
				groupId_milestoneId: {
					groupId,
					milestoneId,
				},
			},
		});

		if (!existingSubmission) {
			throw new NotFoundException(
				`Submission not found for group ${groupId} and milestone ${milestoneId}`,
			);
		}

		const updateData: any = {
			updatedAt: new Date(),
		};

		// Only update documents if provided
		if (updateSubmissionDto.documents !== undefined) {
			this.validateDocuments(updateSubmissionDto.documents);
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
			include: {
				group: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},
				milestone: {
					select: {
						id: true,
						name: true,
						startDate: true,
						endDate: true,
					},
				},
			},
		});

		this.logger.log(`Submission updated with ID: ${updatedSubmission.id}`);

		// Clear only group submissions cache - specific and minimal cache invalidation
		await this.clearCache(`${SubmissionService.CACHE_KEY}:group:${groupId}`);

		return updatedSubmission;
	}
}
