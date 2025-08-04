import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import {
	// CacheHelperService,
	PrismaService,
} from '@/providers';
import { EmailJobType, EmailQueueService } from '@/queue';
// import { CACHE_KEY } from '@/theses/constants';
import {
	AssignThesisDto,
	PublishThesisDto,
	ReviewThesisDto,
} from '@/theses/dtos';
import { mapThesisDetail } from '@/theses/mappers';
import { ThesisDetailResponse } from '@/theses/responses';

import { ThesisStatus } from '~/generated/prisma';

@Injectable()
export class ThesisModeratorService {
	private readonly logger = new Logger(ThesisModeratorService.name);

	constructor(
		// private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
		private readonly emailQueueService: EmailQueueService,
	) {}

	async publishTheses(dto: PublishThesisDto): Promise<void> {
		this.logger.log(`Publishing theses with isPublish: ${dto.isPublish}`);

		try {
			// Validate input
			if (dto.thesisIds.length === 0) {
				this.logger.warn('No thesis IDs provided for publishing');
				throw new NotFoundException('No thesis IDs provided');
			}

			// Fetch theses with required data (kèm semester)
			const theses = await this.prisma.thesis.findMany({
				where: { id: { in: dto.thesisIds } },
				include: {
					semester: true,
					lecturer: {
						include: {
							user: true,
						},
					},
				},
			});

			// Validate theses exist
			if (theses.length !== dto.thesisIds.length) {
				this.logger.warn(`Some theses not found for publishing`);
				throw new NotFoundException('Some theses not found');
			}

			// Validate semester status for publish
			const invalidSemester = theses.filter(
				(t) =>
					t.semester.status !== 'Preparing' && t.semester.status !== 'Picking',
			);
			if (invalidSemester.length > 0) {
				const thesisIds = invalidSemester.map((t) => t.id).join(', ');
				this.logger.warn(
					`Cannot publish theses because their semester is not in Preparing or Picking: ${thesisIds}`,
				);
				throw new ConflictException(
					`Cannot publish theses when semester are not in Preparing or Picking.`,
				);
			}

			// Get supervision counts for all theses
			const supervisionCounts = await this.prisma.supervision.groupBy({
				by: 'thesisId',
				where: { thesisId: { in: dto.thesisIds } },
				_count: { lecturerId: true },
			});

			// Check if all theses have exactly 2 supervisors
			supervisionCounts.forEach((item) => {
				if (item._count.lecturerId !== 2) {
					this.logger.warn(
						`Thesis ${item.thesisId} does not have exactly 2 supervisors`,
					);
					throw new ConflictException(
						`All theses must have exactly 2 supervisors to be published.`,
					);
				}
			});

			if (dto.isPublish === false) {
				// Validate can unpublish: không cho unpublish nếu thesis đã có group pick
				const thesesWithGroups = theses.filter((thesis) => thesis.groupId);
				if (thesesWithGroups.length > 0) {
					const thesisIdsWithGroups = thesesWithGroups
						.map((t) => t.id)
						.join(', ');
					this.logger.warn(
						'Cannot unpublish theses that have groups: ' + thesisIdsWithGroups,
					);
					throw new ConflictException(
						`Cannot unpublish theses that are already assigned to groups`,
					);
				}
			}

			// Update theses
			const updatedTheses = await this.prisma.thesis.updateMany({
				where: { id: { in: dto.thesisIds } },
				data: { isPublish: dto.isPublish },
			});

			this.logger.log(
				`Theses successfully ${dto.isPublish ? 'published' : 'unpublished'}`,
			);
			this.logger.debug(
				`Updated ${updatedTheses.count} theses to isPublish: ${dto.isPublish}`,
			);

			// Send email notifications for publication status change
			await this.sendThesisStatusChangeNotifications(theses, dto.isPublish);

			// Update cache for each thesis
			// for (const thesis of theses) {
			//  const cacheKey = `${CACHE_KEY}/${thesis.id}`;
			//  await Promise.all([
			//      this.cache.saveToCache(cacheKey, thesis),
			//      this.cache.delete(`${CACHE_KEY}/lecturer/${thesis.lecturerId}`),
			//  ]);
			// }
			// await this.cache.delete(`${CACHE_KEY}/`);
			// await this.cache.delete(`${CACHE_KEY}/semester/${theses[0].semesterId}`);
		} catch (error) {
			this.logger.error('Error publishing theses', error);
			throw error;
		}
	}

	async reviewThesis(
		id: string,
		dto: ReviewThesisDto,
	): Promise<ThesisDetailResponse> {
		this.logger.log(`Reviewing thesis with ID: ${id}`);

		try {
			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with ID ${id} not found for review`);

				throw new NotFoundException(`Thesis not found`);
			}

			// Check if thesis is published
			if (existingThesis.isPublish) {
				this.logger.warn(`Cannot review published thesis with ID ${id}`);

				throw new ConflictException(
					`Cannot review published thesis. Please unpublish it first`,
				);
			}

			// Check if thesis is in pending status
			if (existingThesis.status !== ThesisStatus.Pending) {
				this.logger.warn(
					`Cannot review thesis with status ${existingThesis.status}`,
				);

				throw new ConflictException(
					`Can only review theses with Pending status. Current status: ${existingThesis.status}`,
				);
			}

			const updatedThesis = await this.prisma.thesis.update({
				where: { id },
				data: { status: dto.status },
				include: {
					thesisVersions: {
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: true,
						},
					},
					lecturer: {
						include: { user: true },
					},
				},
			});

			this.logger.log(
				`Thesis with ID: ${id} successfully reviewed. Status changed to ${dto.status}`,
			);
			this.logger.debug('Updated thesis detail', JSON.stringify(updatedThesis));

			const result: ThesisDetailResponse = mapThesisDetail(updatedThesis);

			// Send email notification for status change
			await this.sendThesisStatusChangeNotifications(
				[updatedThesis],
				undefined,
				dto.status,
			);

			// await this.saveAndDeleteCache(result);

			return result;
		} catch (error) {
			this.logger.error(`Error reviewing thesis with ID ${id}`, error);

			throw error;
		}
	}

	async assignThesis(
		id: string,
		dto: AssignThesisDto,
	): Promise<ThesisDetailResponse> {
		this.logger.log(
			`Assigning thesis with ID: ${id} to group with ID: ${dto.groupId}`,
		);

		try {
			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with ID ${id} not found for assignment`);

				throw new NotFoundException(`Thesis not found`);
			}

			// Check if thesis is approved
			if (existingThesis.status !== ThesisStatus.Approved) {
				this.logger.warn(
					`Cannot assign thesis with status ${existingThesis.status}`,
				);

				throw new ConflictException(
					`Can only assign approved theses. Current status: ${existingThesis.status}`,
				);
			}

			// Check if thesis is already assigned
			if (existingThesis.groupId) {
				this.logger.warn(
					`Thesis with ID ${id} is already assigned to group ${existingThesis.groupId}`,
				);

				throw new ConflictException(
					`This thesis is already assigned to another group`,
				);
			}

			// Validate group exists và kiểm tra điều kiện assignment
			const targetGroup = await this.prisma.group.findUnique({
				where: { id: dto.groupId },
			});

			if (!targetGroup) {
				this.logger.warn(`Group with ID ${dto.groupId} not found`);
				throw new NotFoundException(`Group not found`);
			}

			// Check semester status - chỉ cho phép assign khi là Preparing hoặc Picking
			if (targetGroup.semesterId) {
				const semester = await this.prisma.semester.findUnique({
					where: { id: targetGroup.semesterId },
					select: { status: true },
				});
				if (
					!semester ||
					(semester.status !== 'Preparing' && semester.status !== 'Picking')
				) {
					this.logger.warn(
						`Cannot assign thesis. Semester status must be Preparing or Picking. Current status: ${semester?.status}`,
					);
					throw new ConflictException(
						`Can only assign thesis to group in Preparing or Picking semester. Current status: ${semester?.status}`,
					);
				}
			}

			// Check if group already has a thesis
			if (targetGroup.thesisId) {
				this.logger.warn(
					`Group with ID ${dto.groupId} already has thesis ${targetGroup.thesisId}`,
				);

				throw new ConflictException('This group already has a thesis assigned');
			}

			// Check if thesis and group are in the same semester
			if (existingThesis.semesterId !== targetGroup.semesterId) {
				this.logger.warn(
					`Thesis semester ${existingThesis.semesterId} does not match group semester ${targetGroup.semesterId}`,
				);

				throw new ConflictException(
					'Thesis and group must be in the same semester',
				);
			}

			// Assign thesis to group
			await this.prisma.group.update({
				where: { id: dto.groupId },
				data: {
					thesisId: id,
				},
			});

			// Assign group to thesis
			const updatedThesis = await this.prisma.thesis.update({
				where: { id },
				data: { groupId: dto.groupId },
				include: {
					thesisVersions: {
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: true,
						},
					},
					lecturer: {
						include: { user: true },
					},
				},
			});

			this.logger.log(
				`Thesis with ID: ${id} successfully assigned to group with ID: ${dto.groupId}`,
			);
			this.logger.debug('Assignment result', JSON.stringify(updatedThesis));

			const result: ThesisDetailResponse = mapThesisDetail(updatedThesis);

			// await this.saveAndDeleteCache(result);

			return result;
		} catch (error) {
			this.logger.error(
				`Error assigning thesis with ID ${id} to group with ID ${dto.groupId}`,
				error,
			);

			throw error;
		}
	}

	// ------------------------------------------------------------------------------------------
	// Additional methods for thesis management can be added here
	// ------------------------------------------------------------------------------------------

	/**
	 * Send email notifications for thesis status changes (publication/review)
	 */
	private async sendThesisStatusChangeNotifications(
		theses: any[],
		isPublish?: boolean,
		status?: ThesisStatus,
	): Promise<void> {
		try {
			// Group theses by lecturer
			const thesesByLecturer = new Map<string, any[]>();

			for (const thesis of theses) {
				const lecturerId = String(thesis.lecturerId);
				if (!thesesByLecturer.has(lecturerId)) {
					thesesByLecturer.set(lecturerId, []);
				}
				thesesByLecturer.get(lecturerId)!.push(thesis);
			}

			// Send email to each lecturer
			for (const [lecturerId, lecturerTheses] of thesesByLecturer) {
				const lecturer = lecturerTheses[0].lecturer;

				if (!lecturer.user.email) {
					this.logger.warn(`No email found for lecturer ${lecturerId}`);
					continue;
				}

				// Determine if this is a bulk or single thesis update
				const isBulk = lecturerTheses.length > 1;

				// Determine the action type and subject
				let actionType = '';
				let subject = '';
				let isPublicationChange = false;

				if (isPublish !== undefined) {
					// Publication status change
					isPublicationChange = true;
					actionType = isPublish ? 'Published' : 'Unpublished';
					subject = isBulk
						? `Thesis Publication Update - ${lecturerTheses.length} theses ${actionType.toLowerCase()}`
						: `Thesis Publication Update - ${lecturerTheses[0].englishName} ${actionType.toLowerCase()}`;
				} else if (status) {
					// Review status change
					actionType = status;
					subject = isBulk
						? `Thesis Review Update - ${lecturerTheses.length} theses ${status.toLowerCase()}`
						: `Thesis Review Update - ${lecturerTheses[0].englishName} ${status.toLowerCase()}`;
				}

				// Prepare email context
				const emailContext: any = {
					lecturerName: lecturer.user.fullName,
					isPublicationChange,
					actionType,
				};

				if (isBulk) {
					// Bulk update - send list of theses
					emailContext.theses = lecturerTheses.map((thesis) => ({
						englishName: thesis.englishName,
						vietnameseName: thesis.vietnameseName,
						abbreviation: thesis.abbreviation,
						domain: thesis.domain,
					}));
				} else {
					// Single thesis update
					const thesis = lecturerTheses[0];
					emailContext.englishName = thesis.englishName;
					emailContext.vietnameseName = thesis.vietnameseName;
					emailContext.abbreviation = thesis.abbreviation;
					emailContext.domain = thesis.domain;
					emailContext.status = actionType;
				}

				// Send email
				await this.emailQueueService.sendEmail(
					EmailJobType.SEND_THESIS_STATUS_CHANGE,
					{
						to: lecturer.user.email,
						subject: subject,
						context: emailContext,
					},
					500, // delay 500ms
				);

				this.logger.log(
					`Thesis status change notification sent to ${lecturer.user.email} for ${lecturerTheses.length} thesis(es)`,
				);
			}
		} catch (error) {
			this.logger.error(
				'Failed to send thesis status change notifications',
				error,
			);
			// Don't throw error as this is a non-critical operation
		}
	}

	// private async saveAndDeleteCache(result: ThesisDetailResponse) {
	// 	const cacheKey = `${CACHE_KEY}/${result.id}`;
	// 	await Promise.all([
	// 		this.cache.saveToCache(cacheKey, result),
	// 		this.cache.delete(`${CACHE_KEY}/`),
	// 		this.cache.delete(`${CACHE_KEY}/semester/${result.semesterId}`),
	// 		this.cache.delete(`${CACHE_KEY}/lecturer/${result.lecturerId}`),
	// 	]);
	// }
}
