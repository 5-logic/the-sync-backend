import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import {
	AssignBulkLecturerReviewerDto,
	UpdateReviewerAssignmentDto,
} from '@/reviews/dtos';
import { ReviewService } from '@/reviews/services/review.service';

@Injectable()
export class ReviewModeratorService {
	private readonly logger = new Logger(ReviewModeratorService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly reviewService: ReviewService,
	) {}

	async getEligibleReviewers(submissionId: string) {
		try {
			const submission = await this.prisma.submission.findUnique({
				where: { id: submissionId },
			});

			if (!submission) {
				this.logger.warn(`Submission with ID ${submissionId} does not exist`);
				throw new NotFoundException(
					`Submission with ID ${submissionId} does not exist`,
				);
			}

			let supervisorIds: string[] = [];
			if (submission.groupId) {
				const group = await this.prisma.group.findUnique({
					where: { id: submission.groupId },
					select: {
						thesis: {
							select: {
								supervisions: true,
							},
						},
					},
				});
				if (group?.thesis?.supervisions) {
					supervisorIds = group.thesis.supervisions.map((s) => s.lecturerId);
				}
			}

			const lecturers = await this.prisma.lecturer.findMany({
				where: {
					assignmentReviews: {
						none: {
							submissionId: submissionId,
						},
					},
					...(supervisorIds.length > 0
						? { userId: { notIn: supervisorIds } }
						: {}),
				},
				include: {
					user: true,
				},
			});

			this.logger.log(
				`Found ${lecturers.length} eligible reviewers for submission ID ${submissionId}`,
			);
			this.logger.debug(
				`Eligible reviewers: ${JSON.stringify(lecturers, null, 2)}`,
			);
			return lecturers;
		} catch (error) {
			this.logger.error(
				`Error fetching eligible reviewers for submission ID ${submissionId}`,
				error,
			);
			throw error;
		}
	}

	async assignBulkReviewer(assignDto: AssignBulkLecturerReviewerDto) {
		try {
			const { assignments } = assignDto;

			const submissionIds = assignments.map((a) => a.submissionId);
			const submissions = await this.prisma.submission.findMany({
				where: { id: { in: submissionIds } },
				include: {
					milestone: {
						select: {
							id: true,
							endDate: true,
							semester: true,
						},
					},
				},
			});

			const now = new Date();
			const endedMilestoneSubmissions = submissions.filter(
				(s) => now > s.milestone?.endDate,
			);
			if (endedMilestoneSubmissions.length > 0) {
				const ids = endedMilestoneSubmissions.map((s) => s.id).join(', ');
				this.logger.warn(
					`Cannot assign reviewers: milestone ended for submissions: ${ids}`,
				);
				throw new BadRequestException(
					'Cannot assign reviewers to submissions whose milestone has ended',
				);
			}

			const notOngoingSemesterSubmissions = submissions.filter(
				(s) => s.milestone?.semester?.status !== 'Ongoing',
			);
			if (notOngoingSemesterSubmissions.length > 0) {
				const ids = notOngoingSemesterSubmissions.map((s) => s.id).join(', ');
				this.logger.warn(
					`Cannot assign reviewers: semester is not Ongoing for submissions: ${ids}`,
				);
				throw new BadRequestException(
					'Can only assign reviewers when the semester is in Ongoing status.',
				);
			}

			const results: Array<{
				submissionId: string;
				assignedCount: number;
				reviewerAssignments: { lecturerId: string; isMainReviewer?: boolean }[];
			}> = [];
			let totalAssignedCount = 0;

			for (const assignment of assignments) {
				const submissionId = assignment.submissionId;
				const reviewerAssignments = assignment.reviewerAssignments;

				await this.prisma.assignmentReview.deleteMany({
					where: { submissionId },
				});

				if (!reviewerAssignments || reviewerAssignments.length !== 2) {
					this.logger.warn(
						`Submission ${submissionId} must have exactly 2 reviewers. Provided: ${reviewerAssignments ? reviewerAssignments.length : 0}`,
					);
					throw new BadRequestException(
						`Each submission must have exactly 2 reviewers. Submission ${submissionId} does not meet this requirement.`,
					);
				}

				const lecturerIds = reviewerAssignments.map((r) => r.lecturerId);
				await this.reviewService.validateLecturersExistAndNotSupervisor(
					lecturerIds,
					submissionId,
				);

				const assignmentData: Array<{
					reviewerId: string;
					submissionId: string;
					isMainReviewer: boolean;
				}> = reviewerAssignments.map((r) => ({
					reviewerId: r.lecturerId,
					submissionId: submissionId,
					isMainReviewer: !!r.isMainReviewer,
				}));

				const submissionAssignments =
					await this.prisma.assignmentReview.createMany({
						data: assignmentData,
						skipDuplicates: true,
					});

				totalAssignedCount += submissionAssignments.count;
				results.push({
					submissionId,
					assignedCount: submissionAssignments.count,
					reviewerAssignments,
				});
			}

			this.logger.log(
				`Bulk assignment completed: ${totalAssignedCount} total assignments across ${assignments.length} submissions`,
			);

			await this.reviewService.sendReviewerAssignmentNotifications(assignments);

			return {
				totalAssignedCount,
				submissionCount: assignments.length,
				results,
			};
		} catch (error) {
			this.logger.error(
				`Error bulk assigning reviewers for ${assignDto.assignments.length} submissions`,
				error,
			);
			throw error;
		}
	}

	async changeReviewer(
		submissionId: string,
		updateDto: UpdateReviewerAssignmentDto,
	) {
		try {
			this.logger.log(
				`Updating reviewer assignments for submission ID ${submissionId}`,
			);

			await this.reviewService.validateReviewer(
				updateDto.newReviewerId,
				submissionId,
				updateDto.currentReviewerId,
			);

			const existingReviewers = await this.prisma.assignmentReview.findFirst({
				where: {
					submissionId: submissionId,
					reviewerId: updateDto.currentReviewerId,
				},
			});

			if (!existingReviewers) {
				this.logger.warn(
					`No existing reviewer assignment found for submission ID ${submissionId} and reviewer ID ${updateDto.currentReviewerId}`,
				);
				throw new NotFoundException(
					'No existing reviewer assignment found for group',
				);
			}

			const changeReviewer = await this.prisma.assignmentReview.update({
				where: {
					submissionId_reviewerId: {
						submissionId: submissionId,
						reviewerId: updateDto.currentReviewerId,
					},
				},
				data: {
					reviewerId: updateDto.newReviewerId,
				},
			});

			this.logger.log(
				`Reviewer assignment updated successfully for submission ID ${submissionId}`,
			);
			this.logger.debug(
				`Updated assignment: ${JSON.stringify(changeReviewer, null, 2)}`,
			);

			return changeReviewer;
		} catch (error) {
			this.logger.error(
				`Error updating reviewer assignments for submission ID ${submissionId}`,
				error,
			);
			throw error;
		}
	}
}
