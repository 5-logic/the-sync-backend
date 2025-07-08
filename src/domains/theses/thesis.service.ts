import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { BaseCacheService } from '@/bases/base-cache.service';
import { EmailJobDto } from '@/email/dto/email-job.dto';
import { GroupService } from '@/groups/group.service';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import {
	AssignThesisDto,
	CreateThesisDto,
	PublishThesisDto,
	ReviewThesisDto,
	UpdateThesisDto,
} from '@/theses/dto';

import { ThesisStatus } from '~/generated/prisma';

@Injectable()
export class ThesisService extends BaseCacheService {
	private static readonly INITIAL_VERSION = 1;
	private static readonly CACHE_KEY = 'cache:thesis';

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(CACHE_MANAGER) cacheManager: Cache,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
		@Inject(GroupService) private readonly groupService: GroupService,
	) {
		super(cacheManager, ThesisService.name);
	}

	/**
	 * Helper method to send thesis status change email notification
	 */
	private async sendThesisStatusChangeEmail(
		thesisId: string,
		newStatus: string,
		isPublicationChange: boolean = false,
	) {
		try {
			// Get thesis with lecturer information
			const thesis = await this.prisma.thesis.findUnique({
				where: { id: thesisId },
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

			if (!thesis) {
				this.logger.warn(`Thesis with ID ${thesisId} not found for email`);
				return;
			}

			// Determine email subject based on the type of change
			let subject: string;
			if (isPublicationChange) {
				subject = `Thesis Publication Update - ${thesis.englishName}`;
			} else {
				subject = `Thesis Review Status Update - ${thesis.englishName}`;
			}

			// Prepare email data
			const emailDto: EmailJobDto = {
				to: thesis.lecturer.user.email,
				subject,
				context: {
					lecturerName: thesis.lecturer.user.fullName,
					englishName: thesis.englishName,
					vietnameseName: thesis.vietnameseName,
					abbreviation: thesis.abbreviation,
					domain: thesis.domain,
					status: newStatus,
				},
			};

			// Send email
			await this.emailQueueService.sendEmail(
				EmailJobType.SEND_THESIS_STATUS_CHANGE,
				emailDto,
				500,
			);

			this.logger.log(
				`${isPublicationChange ? 'Publication' : 'Review status'} change email sent to ${thesis.lecturer.user.email} for thesis ${thesisId}`,
			);
		} catch (error) {
			this.logger.error(
				`Error sending status change email for thesis ${thesisId}`,
				error,
			);
			// Don't throw error to avoid breaking the main operation
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
			// Get all theses with lecturer information
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

			if (theses.length === 0) {
				this.logger.warn('No theses found for bulk email notification');
				return;
			}

			// Group theses by lecturer
			const thesesByLecturer = theses.reduce(
				(acc, thesis) => {
					const lecturerEmail = thesis.lecturer.user.email;
					acc[lecturerEmail] ??= {
						lecturer: thesis.lecturer.user,
						theses: [],
					};
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
						};
					}

					const emailDto: EmailJobDto = {
						to: email,
						subject,
						context,
					};

					// Send email
					await this.emailQueueService.sendEmail(emailType, emailDto, 500);

					this.logger.log(
						`${
							isPublicationChange ? 'Publication' : 'Review status'
						} change email sent to ${email} for ${lecturerTheses.length} ${
							lecturerTheses.length === 1 ? 'thesis' : 'theses'
						}`,
					);
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

	async create(lecturerId: string, dto: CreateThesisDto) {
		try {
			const {
				supportingDocument,
				englishName,
				vietnameseName,
				abbreviation,
				description,
				domain,
				skillIds,
				semesterId,
			} = dto;

			// Validate skillIds if provided
			if (skillIds && skillIds.length > 0) {
				await this.validateSkillIds(skillIds);
			}

			const newThesis = await this.prisma.$transaction(async (prisma) => {
				// Create thesis
				const thesis = await prisma.thesis.create({
					data: {
						englishName,
						vietnameseName,
						abbreviation,
						description,
						domain,
						lecturerId,
						semesterId,
					},
				});

				// Create the first thesis version
				await prisma.thesisVersion.create({
					data: {
						version: ThesisService.INITIAL_VERSION,
						supportingDocument,
						thesisId: thesis.id,
					},
				});

				//  Create first supervisor who create thí thesis
				await prisma.supervision.create({
					data: {
						lecturerId,
						thesisId: thesis.id,
					},
				});

				// Create thesis required skills if skillIds provided
				if (skillIds && skillIds.length > 0) {
					await prisma.thesisRequiredSkill.createMany({
						data: skillIds.map((skillId) => ({
							thesisId: thesis.id,
							skillId,
						})),
					});
				}

				// Return thesis with version and skills information
				return prisma.thesis.findUnique({
					where: { id: thesis.id },
					include: {
						thesisVersions: {
							select: { id: true, version: true, supportingDocument: true },
							orderBy: { version: 'desc' },
						},
						thesisRequiredSkills: {
							include: {
								skill: {
									select: {
										id: true,
										name: true,
									},
								},
							},
						},
					},
				});
			});

			if (!newThesis) {
				throw new ConflictException('Failed to create thesis');
			}

			// Clear specific cache after successful creation
			await this.clearCache(`${ThesisService.CACHE_KEY}:${newThesis.id}`);

			this.logger.log(`Thesis created with ID: ${newThesis.id}`);
			this.logger.debug('Thesis detail', newThesis);

			return newThesis;
		} catch (error) {
			this.logger.error('Error creating thesis', error);

			throw error;
		}
	}

	async findAll() {
		try {
			this.logger.log('Fetching all theses');

			// No cache for list operations to ensure real-time data
			const theses = await this.prisma.thesis.findMany({
				include: {
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${theses.length} theses`);
			this.logger.debug('Theses detail', theses);

			return theses;
		} catch (error) {
			this.logger.error('Error fetching theses', error);

			throw error;
		}
	}

	async findOne(id: string) {
		try {
			this.logger.log(`Fetching thesis with id: ${id}`);

			// Use cache-aside pattern with short TTL for individual thesis data
			const cacheKey = `${ThesisService.CACHE_KEY}:${id}`;

			return await this.getWithCacheAside(
				cacheKey,
				async () => {
					const thesis = await this.prisma.thesis.findUnique({
						where: { id },
						include: {
							thesisVersions: {
								select: { id: true, version: true, supportingDocument: true },
								orderBy: { version: 'desc' },
							},
							thesisRequiredSkills: {
								include: {
									skill: {
										select: {
											id: true,
											name: true,
										},
									},
								},
							},
						},
					});

					if (!thesis) {
						this.logger.warn(`Thesis with ID ${id} not found`);
						throw new NotFoundException(`Thesis not found`);
					}

					this.logger.log(`Thesis found with ID: ${id} (from DB)`);
					this.logger.debug('Thesis detail', thesis);
					return thesis;
				},
				300000, // 5 minutes TTL for individual thesis data
			);
		} catch (error) {
			this.logger.error(`Error fetching thesis with ID ${id}`, error);
			throw error;
		}
	}

	async findAllBySemesterId(semesterId: string) {
		try {
			this.logger.log(
				`Fetching all theses for semester with ID: ${semesterId}`,
			);

			// No cache for list operations to ensure real-time data
			const theses = await this.prisma.thesis.findMany({
				where: { semesterId },
				include: {
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
					lecturer: {
						include: {
							user: {
								select: {
									id: true,
									fullName: true,
									email: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(
				`Found ${theses.length} theses for semester ${semesterId}`,
			);
			this.logger.debug('Theses detail', theses);

			return theses;
		} catch (error) {
			this.logger.error(
				`Error fetching theses for semester with ID ${semesterId}`,
				error,
			);

			throw error;
		}
	}

	async findAllByLecturerId(lecturerId: string) {
		try {
			this.logger.log(
				`Fetching all theses for lecturer with ID: ${lecturerId}`,
			);

			// No cache for list operations to ensure real-time data
			const theses = await this.prisma.thesis.findMany({
				where: { lecturerId },
				include: {
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
						orderBy: { version: 'desc' },
					},
					thesisRequiredSkills: {
						include: {
							skill: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			return theses;
		} catch (error) {
			this.logger.error(
				`Error fetching theses for lecturer with ID ${lecturerId}`,
				error,
			);
			throw error;
		}
	}

	async publishTheses(dto: PublishThesisDto) {
		try {
			this.logger.log(`Publishing theses with isPublish: ${dto.isPublish}`);

			// Validate input
			this.validateThesesIds(dto.thesesIds);

			// Fetch theses with required data
			const theses = await this.fetchThesesForPublishing(dto.thesesIds);

			// Validate theses exist
			this.validateThesesExist(theses, dto.thesesIds);

			// Validate business rules
			this.validateThesesForPublishing(theses);
			if (dto.isPublish) {
				this.validateCanPublishTheses(theses);
			} else {
				this.validateCanUnpublishTheses(theses);
			}

			// Update theses
			await this.updateThesesPublicationStatus(dto.thesesIds, dto.isPublish);

			// Send notifications
			this.sendPublicationNotifications(dto.thesesIds, dto.isPublish);

			// Clear cache for updated theses
			await Promise.all(
				dto.thesesIds.map((id) =>
					this.clearCache(`${ThesisService.CACHE_KEY}:${id}`),
				),
			);

			// Return updated theses
			return await this.fetchUpdatedTheses(dto.thesesIds);
		} catch (error) {
			this.logger.error('Error publishing theses', error);
			throw error;
		}
	}

	/**
	 * Validate thesis IDs input
	 */
	private validateThesesIds(thesesIds: string[]) {
		if (!thesesIds || thesesIds.length === 0) {
			this.logger.warn('No thesis IDs provided for publishing');
			throw new NotFoundException('No thesis IDs provided');
		}
	}

	/**
	 * Fetch theses with publication-related data
	 */
	private async fetchThesesForPublishing(thesesIds: string[]) {
		return await this.prisma.thesis.findMany({
			where: { id: { in: thesesIds } },
			select: {
				id: true,
				status: true,
				isPublish: true,
				group: { select: { id: true } },
			},
		});
	}

	/**
	 * Validate that all requested theses exist
	 */
	private validateThesesExist(theses: any[], thesesIds: string[]) {
		if (theses.length !== thesesIds.length) {
			this.logger.warn(`Some theses not found for publishing`);
			throw new NotFoundException('Some theses not found');
		}
	}

	/**
	 * Validate theses meet publishing requirements
	 */
	private validateThesesForPublishing(theses: any[]) {
		const notApproved = theses.filter(
			(t) => t.status !== ThesisStatus.Approved,
		);

		if (notApproved.length > 0) {
			this.logger.warn('Some theses are not approved and cannot be published');
			throw new ConflictException(
				'All theses must be approved before publishing',
			);
		}
	}

	/**
	 * Validate that theses can be published
	 */
	private validateCanPublishTheses(theses: any[]) {
		this.validatePublishAction(theses);
	}

	/**
	 * Validate that theses can be unpublished
	 */
	private validateCanUnpublishTheses(theses: any[]) {
		this.validateUnpublishAction(theses);
	}

	/**
	 * Validate publish action
	 */
	private validatePublishAction(theses: any[]) {
		const alreadyPublished = theses.filter((t) => t.isPublish);

		if (alreadyPublished.length > 0) {
			this.logger.warn(
				'Some theses are already published and cannot be published again',
			);
			throw new ConflictException(
				`${alreadyPublished.length} ${
					alreadyPublished.length === 1 ? 'thesis is' : 'theses are'
				} already published and cannot be published again`,
			);
		}
	}

	/**
	 * Validate unpublish action
	 */
	private validateUnpublishAction(theses: any[]) {
		// Check if already unpublished
		const alreadyUnpublished = theses.filter((t) => !t.isPublish);
		if (alreadyUnpublished.length > 0) {
			this.logger.warn(
				'Some theses are already unpublished and cannot be unpublished again',
			);
			throw new ConflictException(
				`${alreadyUnpublished.length} ${
					alreadyUnpublished.length === 1 ? 'thesis is' : 'theses are'
				} already unpublished and cannot be unpublished again`,
			);
		}

		// Check if any thesis has been selected by a group
		const thesesWithGroups = theses.filter((t) => t.group !== null);
		if (thesesWithGroups.length > 0) {
			this.logger.warn(
				'Some theses have been selected by groups and cannot be unpublished',
			);
			throw new ConflictException(
				`${thesesWithGroups.length} ${
					thesesWithGroups.length === 1 ? 'thesis has' : 'theses have'
				} been selected by groups and cannot be unpublished. Only theses without group selections can be unpublished.`,
			);
		}
	}

	/**
	 * Update theses publication status
	 */
	private async updateThesesPublicationStatus(
		thesesIds: string[],
		isPublish: boolean,
	) {
		await this.prisma.thesis.updateMany({
			where: { id: { in: thesesIds } },
			data: { isPublish },
		});

		this.logger.log(
			`Successfully ${isPublish ? 'published' : 'unpublished'} ${thesesIds.length} theses`,
		);
	}

	/**
	 * Send publication notification emails
	 */
	private sendPublicationNotifications(
		thesesIds: string[],
		isPublish: boolean,
	) {
		const newStatus = isPublish ? 'Published' : 'Unpublished';

		this.sendBulkThesisStatusChangeEmail(thesesIds, newStatus, true).catch(
			(error) => {
				this.logger.error('Error sending bulk publication emails', error);
			},
		);
	}

	/**
	 * Fetch updated theses with complete data
	 */
	private async fetchUpdatedTheses(thesesIds: string[]) {
		return await this.prisma.thesis.findMany({
			where: { id: { in: thesesIds } },
			include: {
				thesisVersions: {
					select: { id: true, version: true, supportingDocument: true },
					orderBy: { version: 'desc' },
				},
			},
		});
	}

	async update(lecturerId: string, id: string, dto: UpdateThesisDto) {
		try {
			this.logger.log(
				`Updating thesis with ID: ${id} by lecturer with ID: ${lecturerId}`,
			);

			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
				include: {
					thesisVersions: {
						select: { version: true },
						orderBy: { version: 'desc' },
						take: 1,
					},
				},
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with ID ${id} not found for update`);

				throw new NotFoundException(`Thesis not found`);
			}

			if (existingThesis.lecturerId !== lecturerId) {
				this.logger.warn(
					`Lecturer with ID ${lecturerId} is not authorized to update thesis with ID ${id}`,
				);

				throw new ForbiddenException(
					`You do not have permission to update this thesis`,
				);
			}

			const {
				supportingDocument,
				englishName,
				vietnameseName,
				abbreviation,
				description,
				domain,
				skillIds,
			} = dto;

			// Validate skillIds if provided
			if (skillIds && skillIds.length > 0) {
				await this.validateSkillIds(skillIds);
			}

			const updatedThesis = await this.prisma.$transaction(async (prisma) => {
				// Update thesis data (excluding supportingDocument)
				await prisma.thesis.update({
					where: { id },
					data: {
						englishName,
						vietnameseName,
						abbreviation,
						description,
						domain,
					},
				});

				// If supportingDocument is provided, create a new version
				if (supportingDocument) {
					const latestVersion =
						existingThesis.thesisVersions[0]?.version ??
						ThesisService.INITIAL_VERSION;
					const newVersion = latestVersion + 1;

					await prisma.thesisVersion.create({
						data: {
							version: newVersion,
							supportingDocument,
							thesisId: id,
						},
					});

					this.logger.log(
						`Created new thesis version ${newVersion} for thesis ID: ${id}`,
					);
				}

				// Update thesis required skills if skillIds provided
				if (skillIds !== undefined) {
					// Delete existing skills
					await prisma.thesisRequiredSkill.deleteMany({
						where: { thesisId: id },
					});

					// Create new skills if any provided
					if (skillIds.length > 0) {
						await prisma.thesisRequiredSkill.createMany({
							data: skillIds.map((skillId) => ({
								thesisId: id,
								skillId,
							})),
						});
					}

					this.logger.log(
						`Updated thesis required skills for thesis ID: ${id}. New skills count: ${skillIds.length}`,
					);
				}

				// Return updated thesis with all versions and skills
				return prisma.thesis.findUnique({
					where: { id },
					include: {
						thesisVersions: {
							select: { id: true, version: true, supportingDocument: true },
							orderBy: { version: 'desc' },
						},
						thesisRequiredSkills: {
							include: {
								skill: {
									select: {
										id: true,
										name: true,
									},
								},
							},
						},
					},
				});
			});

			if (!updatedThesis) {
				throw new ConflictException('Failed to update thesis');
			}

			this.logger.log(`Thesis updated with ID: ${updatedThesis.id}`);
			this.logger.debug('Updated thesis detail', updatedThesis);

			// Clear specific cache after successful update
			await this.clearCache(`${ThesisService.CACHE_KEY}:${updatedThesis.id}`);

			return updatedThesis;
		} catch (error) {
			this.logger.error(`Error updating thesis with ID ${id}`, error);

			throw error;
		}
	}

	async submitForReview(lecturerId: string, id: string) {
		try {
			this.logger.log(
				`Submitting thesis with ID: ${id} for review by lecturer with ID: ${lecturerId}`,
			);

			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
				select: {
					id: true,
					status: true,
					lecturerId: true,
					englishName: true,
				},
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with ID ${id} not found for submit`);

				throw new NotFoundException(`Thesis not found`);
			}

			if (existingThesis.lecturerId !== lecturerId) {
				this.logger.warn(
					`Lecturer with ID ${lecturerId} is not authorized to submit thesis with ID ${id}`,
				);

				throw new ForbiddenException(
					`You do not have permission to submit this thesis`,
				);
			}

			// Check if thesis status allows submission for review
			if (existingThesis.status === ThesisStatus.Pending) {
				throw new ConflictException(
					'This thesis is already pending review and cannot be submitted again',
				);
			}

			if (existingThesis.status === ThesisStatus.Approved) {
				throw new ConflictException(
					'This thesis has already been approved and cannot be submitted for review again',
				);
			}

			// Only allow submission from New or Rejected status
			if (
				existingThesis.status !== ThesisStatus.New &&
				existingThesis.status !== ThesisStatus.Rejected
			) {
				throw new ConflictException(
					`Cannot submit thesis with current status for review`,
				);
			}

			const updatedThesis = await this.prisma.thesis.update({
				where: { id },
				data: {
					status: ThesisStatus.Pending,
				},
				include: {
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
						orderBy: { version: 'desc' },
					},
				},
			});

			this.logger.log(
				`Thesis with ID: ${id} successfully submitted for review. Status changed to Pending`,
			);
			this.logger.debug('Updated thesis detail', updatedThesis);

			// Clear specific cache after successful status update
			await this.clearCache(`${ThesisService.CACHE_KEY}:${id}`);

			// Send notification email about submission (review status change)
			this.sendThesisStatusChangeEmail(id, 'Pending', false).catch((error) => {
				this.logger.error(
					`Error sending submission notification email for thesis ${id}`,
					error,
				);
			});

			return updatedThesis;
		} catch (error) {
			this.logger.error(
				`Error submitting thesis with ID ${id} for review`,
				error,
			);

			throw error;
		}
	}

	async reviewThesis(id: string, dto: ReviewThesisDto) {
		try {
			this.logger.log(`Reviewing thesis with ID: ${id}`);

			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
				select: {
					id: true,
					status: true,
					isPublish: true,
					englishName: true,
				},
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with ID ${id} not found for review`);

				throw new NotFoundException(`Thesis not found`);
			}

			// Check if thesis is published
			if (existingThesis.isPublish) {
				this.logger.warn(`Cannot review published thesis with ID ${id}`);
				throw new ConflictException(
					'Cannot review a published thesis. Published theses cannot have their review status changed.',
				);
			}

			// Only allow review of pending theses
			if (existingThesis.status !== ThesisStatus.Pending) {
				throw new ConflictException(
					`Cannot review thesis with status ${existingThesis.status}. Only ${ThesisStatus.Pending} theses can be reviewed.`,
				);
			}

			if (
				dto.status !== ThesisStatus.Approved &&
				dto.status !== ThesisStatus.Rejected
			) {
				throw new ConflictException(
					`Invalid status ${dto.status}. Only ${ThesisStatus.Approved} or ${ThesisStatus.Rejected} are allowed.`,
				);
			}

			const updatedThesis = await this.prisma.thesis.update({
				where: { id },
				data: {
					status: dto.status,
				},
				include: {
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
						orderBy: { version: 'desc' },
					},
				},
			});

			this.logger.log(
				`Thesis with ID: ${id} successfully reviewed. Status changed to ${dto.status}`,
			);

			this.logger.debug('Reviewed thesis detail', updatedThesis);

			// Clear specific cache after successful review
			await this.clearCache(`${ThesisService.CACHE_KEY}:${id}`);

			// Send status change email (review status change)
			await this.sendThesisStatusChangeEmail(id, dto.status, false);

			return updatedThesis;
		} catch (error) {
			this.logger.error(`Error reviewing thesis with ID ${id}`, error);

			throw error;
		}
	}

	async remove(lecturerId: string, id: string) {
		try {
			this.logger.log(
				`Attempting to delete thesis with ID: ${id} by lecturer with ID: ${lecturerId}`,
			);

			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with ID ${id} not found for deletion`);

				throw new NotFoundException(`Thesis not found`);
			}

			// Check ownership - only the lecturer who created the thesis can delete it
			if (existingThesis.lecturerId !== lecturerId) {
				this.logger.warn(
					`Lecturer with ID ${lecturerId} is not authorized to delete thesis with ID ${id}`,
				);

				throw new ForbiddenException(
					`You do not have permission to delete this thesis`,
				);
			}

			// Only allow deletion of New or Rejected theses
			if (
				existingThesis.status !== ThesisStatus.New &&
				existingThesis.status !== ThesisStatus.Rejected
			) {
				throw new ConflictException(
					`Cannot delete thesis with status ${existingThesis.status}. Only ${ThesisStatus.New} or ${ThesisStatus.Rejected} theses can be deleted.`,
				);
			}

			// Delete thesis and return the deleted thesis object
			const deletedThesis = await this.prisma.thesis.delete({
				where: { id },
			});

			this.logger.log(`Thesis with ID: ${id} successfully deleted`);
			this.logger.debug('Deleted thesis detail', deletedThesis);

			// Clear specific cache after successful deletion
			await this.clearCache(`${ThesisService.CACHE_KEY}:${id}`);

			return deletedThesis;
		} catch (error) {
			this.logger.error(`Error deleting thesis with ID ${id}`, error);

			throw error;
		}
	}

	/**
	 * Validate that all skill IDs exist in the database
	 */
	private async validateSkillIds(skillIds: string[]) {
		const existingSkills = await this.prisma.skill.findMany({
			where: { id: { in: skillIds } },
			select: { id: true },
		});

		if (existingSkills.length !== skillIds.length) {
			const existingSkillIds = existingSkills.map((skill) => skill.id);
			const missingSkillIds = skillIds.filter(
				(id) => !existingSkillIds.includes(id),
			);

			this.logger.warn(
				`Skills with IDs ${missingSkillIds.join(', ')} do not exist`,
			);
			throw new NotFoundException(
				`Skills with IDs ${missingSkillIds.join(', ')} do not exist`,
			);
		}
	}

	async assignThesis(id: string, dto: AssignThesisDto) {
		try {
			this.logger.log(
				`Attempting to assign thesis with ID: ${id} to group with ID: ${dto.groupId}`,
			);

			// Check if thesis exists and is approved
			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
				include: {
					group: {
						select: { id: true, code: true, name: true },
					},
					semester: {
						select: { id: true, name: true, status: true },
					},
				},
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with ID ${id} not found for assignment`);
				throw new NotFoundException(`Thesis not found`);
			}

			// Check if thesis is approved and published
			if (existingThesis.status !== ThesisStatus.Approved) {
				throw new ConflictException(
					`Cannot assign thesis with status ${existingThesis.status}. Only ${ThesisStatus.Approved} theses can be assigned.`,
				);
			}

			if (!existingThesis.isPublish) {
				throw new ConflictException(
					'Cannot assign unpublished thesis. Please publish the thesis first.',
				);
			}

			// Check if thesis is already assigned to a group
			if (existingThesis.group) {
				throw new ConflictException(
					`Thesis is already assigned to group ${existingThesis.group.code} (${existingThesis.group.name})`,
				);
			}

			// Check if group exists and is in the same semester
			const targetGroup = await this.prisma.group.findUnique({
				where: { id: dto.groupId },
				include: {
					thesis: {
						select: { id: true, englishName: true },
					},
					semester: {
						select: { id: true, name: true },
					},
				},
			});

			if (!targetGroup) {
				this.logger.warn(`Group with ID ${dto.groupId} not found`);
				throw new NotFoundException(`Group not found`);
			}

			// Check if group already has a thesis assigned
			if (targetGroup.thesis) {
				throw new ConflictException(
					`Group already has thesis "${targetGroup.thesis.englishName}" assigned`,
				);
			}

			// Check if thesis and group are in the same semester
			if (existingThesis.semesterId !== targetGroup.semesterId) {
				throw new ConflictException(
					`Thesis is in semester "${existingThesis.semester.name}" but group is in semester "${targetGroup.semester.name}". They must be in the same semester.`,
				);
			}

			// Assign thesis to group
			const updatedGroup = await this.prisma.group.update({
				where: { id: dto.groupId },
				data: {
					thesisId: id,
				},
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
										select: {
											id: true,
											fullName: true,
											email: true,
										},
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
			this.logger.debug('Assignment result', updatedGroup);

			// Clear specific cache after successful assignment
			await this.clearCache(`${ThesisService.CACHE_KEY}:${id}`);

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
