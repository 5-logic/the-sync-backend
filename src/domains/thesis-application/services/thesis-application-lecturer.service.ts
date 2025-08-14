import { ConflictException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/providers';
import { UpdateThesisApplicationDto } from '@/thesis-application/dtos';

import { ThesisApplicationService } from './thesis-application.service';

@Injectable()
export class ThesisApplicationLecturerService {
	private readonly logger = new Logger(ThesisApplicationLecturerService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly thesisApplicationService: ThesisApplicationService,
	) {}

	async findAll(lecturerId: string, semesterId?: string) {
		this.logger.log(
			`Finding thesis applications for lecturer ${lecturerId}${semesterId ? ` in semester ${semesterId}` : ''}`,
		);

		try {
			await this.thesisApplicationService.validateLecturer(lecturerId);

			const thesesWhere =
				this.thesisApplicationService.buildSupervisedThesesQuery(
					lecturerId,
					semesterId,
				);

			const theses = await this.prisma.thesis.findMany({
				where: thesesWhere,
				select: { id: true },
			});

			if (theses.length === 0) {
				this.logger.log(
					`No supervised theses found for lecturer ${lecturerId}`,
				);
				return [];
			}

			const thesisIds = theses.map((thesis) => thesis.id);

			const thesisApplications = await this.prisma.thesisApplication.findMany({
				where: {
					thesisId: { in: thesisIds },
				},
				include:
					this.thesisApplicationService.getComprehensiveApplicationInclude(),
				orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
			});

			this.logger.log(
				`Found ${thesisApplications.length} thesis applications for lecturer ${lecturerId}`,
			);

			return thesisApplications;
		} catch (error) {
			this.logger.error(
				`Error finding thesis applications for lecturer ${lecturerId}`,
				error,
			);
			throw error;
		}
	}

	async findOne(thesisId: string) {
		this.logger.log(`Finding all applications for thesis ${thesisId}`);

		try {
			const [, applications] = await Promise.all([
				this.thesisApplicationService.validateThesisV2(thesisId),
				this.prisma.thesisApplication.findMany({
					where: { thesisId },
					include:
						this.thesisApplicationService.getComprehensiveApplicationInclude(),
					orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
				}),
			]);

			this.logger.log(
				`Found ${applications.length} applications for thesis ${thesisId}`,
			);

			return applications;
		} catch (error) {
			this.logger.error(
				`Error finding applications for thesis ${thesisId}`,
				error,
			);
			throw error;
		}
	}

	async update(
		lecturerId: string,
		groupId: string,
		thesisId: string,
		updateDto: UpdateThesisApplicationDto,
	) {
		this.logger.log(
			`Updating thesis application for group ${groupId}, thesis ${thesisId} by lecturer ${lecturerId}`,
		);

		try {
			const [, currentApplication] = await Promise.all([
				this.thesisApplicationService.validateSupervision(lecturerId, thesisId),
				this.thesisApplicationService.validateApplication(groupId, thesisId),
			]);

			if (currentApplication.status !== 'Pending') {
				throw new ConflictException(
					`Application has already been ${currentApplication.status.toLowerCase()}`,
				);
			}

			// Pre-approval validation
			if (updateDto.status === 'Approved') {
				await this.thesisApplicationService.validateGroupCanBeApproved(
					groupId,
					thesisId,
				);
			}

			const result = await this.prisma.$transaction(async (tx) => {
				// Double check inside transaction to prevent race condition
				if (updateDto.status === 'Approved') {
					await this.thesisApplicationService.validateGroupCanBeApprovedInTransaction(
						tx,
						groupId,
						thesisId,
					);
				}

				const updatedApplication = await tx.thesisApplication.update({
					where: {
						groupId_thesisId: {
							groupId: groupId,
							thesisId: thesisId,
						},
					},
					data: {
						status: updateDto.status,
						updatedAt: new Date(),
					},
					include:
						this.thesisApplicationService.getComprehensiveApplicationInclude(),
				});

				if (updateDto.status === 'Approved') {
					await this.thesisApplicationService.handleApprovalProcess(
						tx,
						groupId,
						thesisId,
					);
				} else if (updateDto.status === 'Rejected') {
					await this.thesisApplicationService.handleRejectionProcess(
						tx,
						groupId,
						thesisId,
					);
				}

				return updatedApplication;
			});

			this.logger.log(
				`Successfully updated thesis application to ${updateDto.status} for group ${groupId}, thesis ${thesisId}`,
			);

			return result;
		} catch (error) {
			this.logger.error(
				`Error updating thesis application for group ${groupId}, thesis ${thesisId}`,
				error,
			);
			throw error;
		}
	}
}
