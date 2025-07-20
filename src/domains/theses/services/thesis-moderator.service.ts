import { mapThesisDetail } from '../mappers';
import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import {
	AssignThesisDto,
	PublishThesisDto,
	ReviewThesisDto,
} from '@/theses/dtos';
import { ThesisDetailResponse } from '@/theses/responses';

import { ThesisStatus } from '~/generated/prisma';

@Injectable()
export class ThesisModeratorService {
	private readonly logger = new Logger(ThesisModeratorService.name);

	constructor(private readonly prisma: PrismaService) {}

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

			return result;
		} catch (error) {
			this.logger.error(`Error reviewing thesis with ID ${id}`, error);

			throw error;
		}
	}

	async assignThesis(id: string, dto: AssignThesisDto) {
		try {
			this.logger.log(
				`Assigning thesis with ID: ${id} to group with ID: ${dto.groupId}`,
			);

			// Validate thesis exists and meets assignment criteria
			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
				include: {
					semester: { select: { id: true, name: true } },
					group: { select: { id: true } },
				},
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

			// Check if thesis is published
			if (!existingThesis.isPublish) {
				this.logger.warn(`Cannot assign unpublished thesis with ID ${id}`);
				throw new ConflictException(
					`Can only assign published theses. This thesis is not published`,
				);
			}

			// Check if thesis is already assigned
			if (existingThesis.group) {
				this.logger.warn(
					`Thesis with ID ${id} is already assigned to group ${existingThesis.group.id}`,
				);
				throw new ConflictException(
					`This thesis is already assigned to another group`,
				);
			}

			// Validate group exists and meets assignment criteria
			const targetGroup = await this.prisma.group.findUnique({
				where: { id: dto.groupId },
				include: {
					thesis: { select: { id: true, englishName: true } },
					semester: { select: { id: true, name: true } },
				},
			});

			if (!targetGroup) {
				this.logger.warn(`Group with ID ${dto.groupId} not found`);
				throw new NotFoundException(`Group not found`);
			}

			// Check if group already has a thesis
			if (targetGroup.thesis) {
				this.logger.warn(
					`Group with ID ${dto.groupId} already has thesis ${targetGroup.thesis.id}`,
				);
				throw new ConflictException(
					`This group already has a thesis assigned: ${targetGroup.thesis.englishName}`,
				);
			}

			// Check if thesis and group are in the same semester
			if (existingThesis.semester.id !== targetGroup.semester.id) {
				this.logger.warn(
					`Thesis semester ${existingThesis.semester.id} does not match group semester ${targetGroup.semester.id}`,
				);
				throw new ConflictException(
					`Thesis is in semester "${existingThesis.semester.name}" but group is in semester "${targetGroup.semester.name}". They must be in the same semester.`,
				);
			}

			// Assign thesis to group
			const updatedGroup = await this.prisma.group.update({
				where: { id: dto.groupId },
				data: { thesisId: id },
				include: {
					thesis: {
						include: {
							thesisVersions: {
								select: { id: true, version: true, supportingDocument: true },
								orderBy: { version: 'desc' },
							},
							lecturer: {
								include: {
									user: {
										select: { id: true, fullName: true, email: true },
									},
								},
							},
						},
					},
				},
			});

			this.logger.log(
				`Thesis with ID: ${id} successfully assigned to group with ID: ${dto.groupId}`,
			);

			// Send email notifications
			try {
				await this.groupService.sendThesisAssignmentNotification(
					dto.groupId,
					id,
					'assigned',
				);
			} catch (emailError) {
				this.logger.warn(
					'Failed to send thesis assignment notification emails',
					emailError,
				);
			}

			return {
				message: 'Thesis assigned to group successfully',
				group: updatedGroup,
			};
		} catch (error) {
			this.logger.error(
				`Error assigning thesis with ID ${id} to group with ID ${dto.groupId}`,
				error,
			);
			throw error;
		}
	}
}
