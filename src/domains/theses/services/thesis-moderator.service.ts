import { mapThesisDetail } from '../mappers';
import {
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { GroupService } from '@/groups/group.service';
import { PrismaService } from '@/providers';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
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

	constructor(
		private readonly prisma: PrismaService,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
		@Inject(GroupService) private readonly groupService: GroupService,
	) {}

	async publishTheses(dto: PublishThesisDto): Promise<ThesisDetailResponse[]> {
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
				select: {
					id: true,
					status: true,
					isPublish: true,
					group: { select: { id: true } },
				},
			});

			// Validate theses exist
			if (theses.length !== dto.thesisIds.length) {
				this.logger.warn(`Some theses not found for publishing`);
				throw new NotFoundException('Some theses not found');
			}

			// Get supervision counts for all theses
			const supervisionCounts = await this.prisma.supervision.groupBy({
				by: ['thesisId'],
				where: { thesisId: { in: dto.thesisIds } },
				_count: { lecturerId: true },
			});

			const supervisionMap = supervisionCounts.reduce(
				(acc, item) => {
					acc[item.thesisId] = item._count.lecturerId;
					return acc;
				},
				{} as Record<string, number>,
			);

			const thesesWithoutTwoSupervisors = theses.filter(
				(thesis) => (supervisionMap[thesis.id] || 0) !== 2,
			);

			if (thesesWithoutTwoSupervisors.length > 0) {
				this.logger.warn(
					`Some theses do not have exactly 2 supervisors: ${thesesWithoutTwoSupervisors.map((t) => t.id).join(', ')}`,
				);
				throw new ConflictException(
					`All theses must have exactly 2 supervisors to be published. ${
						thesesWithoutTwoSupervisors.length
					} ${
						thesesWithoutTwoSupervisors.length === 1
							? 'thesis has'
							: 'theses have'
					} incorrect supervisor count.`,
				);
			}

			if (dto.isPublish) {
				// Validate can publish
				const notApprovedTheses = theses.filter(
					(thesis) => thesis.status !== ThesisStatus.Approved,
				);
				if (notApprovedTheses.length > 0) {
					this.logger.warn(
						`Some theses are not approved: ${notApprovedTheses.map((t) => t.id).join(', ')}`,
					);
					throw new ConflictException(
						`Only approved theses can be published. ${notApprovedTheses.length} ${
							notApprovedTheses.length === 1 ? 'thesis is' : 'theses are'
						} not approved.`,
					);
				}

				const alreadyPublishedTheses = theses.filter(
					(thesis) => thesis.isPublish,
				);
				if (alreadyPublishedTheses.length > 0) {
					this.logger.warn(
						`Some theses are already published: ${alreadyPublishedTheses.map((t) => t.id).join(', ')}`,
					);
					throw new ConflictException(
						`Some theses are already published. ${alreadyPublishedTheses.length} ${
							alreadyPublishedTheses.length === 1 ? 'thesis is' : 'theses are'
						} already published.`,
					);
				}
			} else {
				// Validate can unpublish
				const notPublishedTheses = theses.filter((thesis) => !thesis.isPublish);
				if (notPublishedTheses.length > 0) {
					this.logger.warn(
						`Some theses are not published: ${notPublishedTheses.map((t) => t.id).join(', ')}`,
					);
					throw new ConflictException(
						`Some theses are not published. ${notPublishedTheses.length} ${
							notPublishedTheses.length === 1 ? 'thesis is' : 'theses are'
						} not published.`,
					);
				}

				const thesesWithGroups = theses.filter((thesis) => thesis.group);
				if (thesesWithGroups.length > 0) {
					this.logger.warn(
						`Some theses have been selected by groups: ${thesesWithGroups.map((t) => t.id).join(', ')}`,
					);
					throw new ConflictException(
						`Cannot unpublish theses that have been selected by groups. ${
							thesesWithGroups.length
						} ${
							thesesWithGroups.length === 1 ? 'thesis has' : 'theses have'
						} been selected by groups and cannot be unpublished.`,
					);
				}
			}

			// Update theses
			await this.prisma.thesis.updateMany({
				where: { id: { in: dto.thesisIds } },
				data: { isPublish: dto.isPublish },
			});

			this.logger.log(
				`Updated publication status for ${dto.thesisIds.length} theses to ${dto.isPublish ? 'published' : 'unpublished'}`,
			);

			// Send notifications
			const status = dto.isPublish ? 'Published' : 'Unpublished';
			this.sendBulkThesisStatusChangeEmail(dto.thesisIds, status, true).catch(
				(error) => {
					this.logger.error(
						`Error sending publication notification emails for theses: ${dto.thesisIds.join(', ')}`,
						error,
					);
				},
			);

			// Return updated theses
			return await this.prisma.thesis.findMany({
				where: { id: { in: dto.thesisIds } },
				include: {
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
						orderBy: { version: 'desc' },
					},
				},
			});
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

	/**
	 * Helper method to send bulk thesis status change email notification
	 * Groups theses by lecturer to minimize email count
	 */
	private async sendBulkThesisStatusChangeEmail(
		thesesIds: string[],
		newStatus: string,
		isPublicationChange: boolean = false,
	) {
		try {
			// Get theses with lecturer information
			const theses = await this.prisma.thesis.findMany({
				where: { id: { in: thesesIds } },
				include: {
					lecturer: {
						include: {
							user: {
								select: {
									email: true,
									fullName: true,
								},
							},
						},
					},
				},
			});

			// Group theses by lecturer email to send bulk emails
			const thesesByLecturer = theses.reduce(
				(acc, thesis) => {
					const lecturerEmail = thesis.lecturer.user.email;
					if (!acc[lecturerEmail]) {
						acc[lecturerEmail] = {
							lecturer: thesis.lecturer.user,
							theses: [],
						};
					}
					acc[lecturerEmail].theses.push({
						id: thesis.id,
						englishName: thesis.englishName,
						vietnameseName: thesis.vietnameseName,
						abbreviation: thesis.abbreviation,
						domain: thesis.domain,
					});
					return acc;
				},
				{} as Record<string, { lecturer: any; theses: any[] }>,
			);

			// Send emails for each lecturer
			const emailPromises = Object.entries(thesesByLecturer).map(
				async ([email, { lecturer, theses: lecturerTheses }]) => {
					// Determine email subject and type
					let subject: string;
					if (isPublicationChange) {
						subject = `Thesis Publication Update - ${lecturerTheses.length} ${
							lecturerTheses.length === 1 ? 'thesis' : 'theses'
						}`;
					} else {
						subject = `Thesis Review Status Update - ${lecturerTheses.length} ${
							lecturerTheses.length === 1 ? 'thesis' : 'theses'
						}`;
					}

					// Use unified email template for both single and bulk
					const emailType = EmailJobType.SEND_THESIS_STATUS_CHANGE;

					// Prepare context for unified template
					let context: any;
					if (lecturerTheses.length === 1) {
						// Single thesis - use single thesis format
						const thesis = lecturerTheses[0];
						context = {
							lecturerName: lecturer.fullName,
							englishName: thesis.englishName,
							vietnameseName: thesis.vietnameseName,
							abbreviation: thesis.abbreviation,
							domain: thesis.domain,
							status: newStatus,
						};
					} else {
						// Multiple theses - use bulk format
						context = {
							lecturerName: lecturer.fullName,
							theses: lecturerTheses,
							actionType: newStatus,
							isPublicationChange,
							thesesCount: lecturerTheses.length,
						};
					}

					try {
						await this.emailQueueService.sendEmail(
							emailType,
							{
								to: email,
								subject,
								context,
							},
							500, // delay
						);

						this.logger.log(
							`${isPublicationChange ? 'Publication' : 'Review status'} change email sent to ${email} for ${lecturerTheses.length} theses`,
						);
					} catch (emailError) {
						this.logger.error(`Error sending email to ${email}`, emailError);
					}
				},
			);

			// Wait for all emails to be sent
			await Promise.allSettled(emailPromises);

			this.logger.log(
				`Bulk status change emails sent for ${thesesIds.length} theses to ${
					Object.keys(thesesByLecturer).length
				} lecturers`,
			);
		} catch (error) {
			this.logger.error('Error sending bulk status change emails', error);
			// Don't throw error to avoid breaking the main operation
		}
	}
}
