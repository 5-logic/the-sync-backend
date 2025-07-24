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
	) {}

	async publishTheses(dto: PublishThesisDto): Promise<void> {
		this.logger.log(`Publishing theses with isPublish: ${dto.isPublish}`);

		try {
			// Validate input
			if (dto.thesisIds.length === 0) {
				this.logger.warn('No thesis IDs provided for publishing');

				throw new NotFoundException('No thesis IDs provided');
			}

			// Fetch theses with required data
			const theses = await this.prisma.thesis.findMany({
				where: { id: { in: dto.thesisIds } },
			});

			// Validate theses exist
			if (theses.length !== dto.thesisIds.length) {
				this.logger.warn(`Some theses not found for publishing`);

				throw new NotFoundException('Some theses not found');
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

			if (!dto.isPublish) {
				// Validate can unpublish
				const thesesWithGroups = theses.filter((thesis) => thesis.groupId);

				if (thesesWithGroups.length > 0) {
					this.logger.warn('Cannot unpublish theses that have groups');

					throw new ConflictException(
						`Cannot unpublish theses that are already assigned to groups.`,
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

			// Update cache for each thesis
			// for (const thesis of theses) {
			// 	const cacheKey = `${CACHE_KEY}/${thesis.id}`;
			// 	await Promise.all([
			// 		this.cache.saveToCache(cacheKey, thesis),
			// 		this.cache.delete(`${CACHE_KEY}/lecturer/${thesis.lecturerId}`),
			// 	]);
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

			// Validate group exists and meets assignment criteria
			const targetGroup = await this.prisma.group.findUnique({
				where: { id: dto.groupId },
			});

			if (!targetGroup) {
				this.logger.warn(`Group with ID ${dto.groupId} not found`);

				throw new NotFoundException(`Group not found`);
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
