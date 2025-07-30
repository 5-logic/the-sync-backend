import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers';
import { SubmissionService } from '@/submissions/services/submission.service';

@Injectable()
export class SubmissionPublicService {
	private readonly logger = new Logger(SubmissionPublicService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly submissionService: SubmissionService,
	) {}

	async findAll() {
		return await this.submissionService.executeWithErrorHandling(
			'Finding all submissions',
			async () => {
				const submissions = await this.prisma.submission.findMany({
					include: SubmissionService.listSubmissionInclude,
					orderBy: {
						createdAt: 'desc',
					},
				});

				this.logger.log(`Found ${submissions.length} submissions`);
				return submissions;
			},
		);
	}

	async findDetail(id: string) {
		return await this.submissionService.executeWithErrorHandling(
			`Finding submission detail for ID: ${id}`,
			async () => {
				const submission = await this.prisma.submission.findUnique({
					where: { id },
					include: {
						...SubmissionService.detailedSubmissionInclude,
						assignmentReviews: {
							include: {
								reviewer: {
									include: {
										user: true,
									},
								},
							},
						},
						group: {
							select: {
								...SubmissionService.basicGroupSelect,
								semester: {
									select: {
										id: true,
										name: true,
										code: true,
										status: true,
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
					},
				});

				if (!submission) {
					throw new NotFoundException('Submission not found');
				}

				const reviewers = (submission.assignmentReviews || []).map((ar) => ({
					id: ar.reviewerId,
					name: ar.reviewer?.user?.fullName,
					email: ar.reviewer?.user?.email,
					isModerator: ar.reviewer?.isModerator,
				}));

				let thesis: any = null;
				let supervisors: any[] = [];
				if (submission.group && (submission.group as any).thesis) {
					const groupThesis = (submission.group as any).thesis;
					thesis = {
						id: groupThesis.id,
						englishName: groupThesis.englishName,
						vietnameseName: groupThesis.vietnameseName,
						abbreviation: groupThesis.abbreviation,
						description: groupThesis.description,
						status: groupThesis.status,
					};
					if (groupThesis.lecturer) {
						supervisors = [
							{
								id: groupThesis.lecturer.user.id,
								fullName: groupThesis.lecturer.user.fullName,
								email: groupThesis.lecturer.user.email,
								isModerator: groupThesis.lecturer.isModerator,
							},
						];
					}
				}

				this.logger.log(`Found submission with ID: ${submission.id}`);
				return {
					submission: {
						id: submission.id,
						status: submission.status,
						createdAt: submission.createdAt,
						updatedAt: submission.updatedAt,
						documents: submission.documents,
					},
					group: {
						...submission.group,
						thesis,
						supervisors,
					},
					reviewers,
				};
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
				where: where,
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
									supervisions: {
										select: {
											lecturer: { select: { user: true, isModerator: true } },
										},
									},
								},
							},
						},
					},
					milestone: {
						select: { id: true, name: true },
					},
					assignmentReviews: {
						include: {
							reviewer: {
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
				orderBy: { createdAt: 'desc' },
			});

			const mappedSubmissions = submissions.map((submission) => {
				let supervisors: any[] = [];
				if (submission.group.thesis) {
					const lecturer = submission.group.thesis.supervisions;
					supervisors = lecturer.map((lect) => ({
						id: lect.lecturer.user.id,
						fullName: lect.lecturer.user.fullName,
						email: lect.lecturer.user.email,
						isModerator: lect.lecturer.isModerator,
					}));
				}

				const thesis = submission.group.thesis
					? {
							id: submission.group.thesis.id,
							englishName: submission.group.thesis.englishName,
							vietnameseName: submission.group.thesis.vietnameseName,
							abbreviation: submission.group.thesis.abbreviation,
							description: submission.group.thesis.description,
							status: submission.group.thesis.status,
							supervisors,
						}
					: null;

				const reviewLecturers = (submission.assignmentReviews || [])
					.map((ar) =>
						ar.reviewer?.user
							? {
									id: ar.reviewer.user.id,
									fullName: ar.reviewer.user.fullName,
									email: ar.reviewer.user.email,
									isModerator: ar.reviewer.isModerator,
								}
							: null,
					)
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
}
