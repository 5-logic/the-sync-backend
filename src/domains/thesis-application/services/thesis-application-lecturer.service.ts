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

			const result = await this.prisma.$transaction(async (tx) => {
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
					// Assign the group to the thesis (bidirectional relationship)
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

					// Auto-reject all other pending applications for this thesis
					const pendingApplications = await tx.thesisApplication.findMany({
						where: {
							thesisId: thesisId,
							groupId: { not: groupId },
							status: 'Pending',
						},
					});

					if (pendingApplications.length > 0) {
						const rejectionPromises = pendingApplications.map((app) =>
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
							`Auto-rejected ${pendingApplications.length} applications for thesis ${thesisId}`,
						);
					}
				} else if (updateDto.status === 'Rejected') {
					// If rejecting an application, check if this group was assigned to this thesis and remove the assignment
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
						// Remove bidirectional relationship
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
