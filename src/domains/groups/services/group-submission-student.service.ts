import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { GroupSubmissionService } from '@/groups/services/group-submission.service';
import { PrismaService } from '@/providers';
import { CreateSubmissionDto, UpdateSubmissionDto } from '@/submissions/dtos';
import { SubmissionService } from '@/submissions/services/submission.service';

@Injectable()
export class GroupSubmissionStudentService {
	private readonly logger = new Logger(GroupSubmissionStudentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly submissionService: SubmissionService,
		private readonly groupSubmissionService: GroupSubmissionService,
	) {}

	async create(
		groupId: string,
		milestoneId: string,
		dto: CreateSubmissionDto,
		userId: string,
	) {
		return await this.submissionService.executeWithErrorHandling(
			'Creating new submission',
			async () => {
				await this.groupSubmissionService.validateCreateSubmissionData(
					groupId,
					milestoneId,
					dto.documents,
					userId,
				);

				const existingSubmission =
					await this.groupSubmissionService.findSubmissionByCompositeKey(
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
						include: SubmissionService.basicSubmissionInclude,
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
					include: SubmissionService.basicSubmissionInclude,
				});

				this.logger.log(`Submission created with ID: ${submission.id}`);

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
		return await this.submissionService.executeWithErrorHandling(
			`Updating submission for group: ${groupId}, milestone: ${milestoneId}`,
			async () => {
				await this.groupSubmissionService.validateUpdateSubmissionData(
					groupId,
					milestoneId,
					updateSubmissionDto.documents,
					userId,
				);

				const existingSubmission =
					await this.groupSubmissionService.findSubmissionByCompositeKey(
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
					include: SubmissionService.basicSubmissionInclude,
				});

				return updatedSubmission;
			},
		);
	}
}
