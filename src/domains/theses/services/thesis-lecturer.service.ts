import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { EmailJobDto } from '@/email/dto/email-job.dto';
import { PrismaService } from '@/providers';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import { CreateThesisDto, UpdateThesisDto } from '@/theses/dtos';

import { ThesisStatus } from '~/generated/prisma';

@Injectable()
export class ThesisLecturerService {
	private readonly logger = new Logger(ThesisLecturerService.name);

	private static readonly INITIAL_VERSION = 1;

	constructor(
		private readonly prisma: PrismaService,
		@Inject(EmailQueueService)
		private readonly emailQueueService: EmailQueueService,
	) {}

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
				`Error sending ${isPublicationChange ? 'publication' : 'review status'} change email for thesis ${thesisId}`,
				error,
			);
			// Don't throw error to avoid breaking the main operation
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
				(skillId) => !existingSkillIds.includes(skillId),
			);

			this.logger.warn(
				`Some skill IDs do not exist: ${missingSkillIds.join(', ')}`,
			);
			throw new NotFoundException(
				`Some skills not found: ${missingSkillIds.join(', ')}`,
			);
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

			// Check maxThesesPerLecturer for this semester
			const semester = await this.prisma.semester.findUnique({
				where: { id: semesterId },
				select: {
					maxThesesPerLecturer: true,
					name: true,
				},
			});
			if (!semester) {
				this.logger.debug(`Semester with ID ${semesterId} not found`);
				throw new NotFoundException('Semester not found');
			}
			const currentThesesCount = await this.prisma.thesis.count({
				where: {
					lecturerId,
					semesterId,
				},
			});
			if (currentThesesCount >= semester.maxThesesPerLecturer) {
				this.logger.warn(
					`Lecturer ${lecturerId} has reached the maximum number of theses (${semester.maxThesesPerLecturer}) in semester ${semester.name}`,
				);
				throw new ConflictException(
					`You have reached the maximum number of theses (${semester.maxThesesPerLecturer}) allowed in semester ${semester.name}`,
				);
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
						version: ThesisLecturerService.INITIAL_VERSION,
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

			this.logger.log(`Thesis created with ID: ${newThesis?.id}`);
			this.logger.debug('New thesis detail', newThesis);

			return newThesis;
		} catch (error) {
			this.logger.error('Error creating thesis', error);

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
						ThesisLecturerService.INITIAL_VERSION;
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
				this.logger.warn(
					`Cannot delete thesis with status ${existingThesis.status}`,
				);

				throw new ConflictException(
					`Cannot delete thesis with current status. Only New or Rejected theses can be deleted`,
				);
			}

			// Check if thesis is published
			if (existingThesis.isPublish) {
				this.logger.warn(`Cannot delete published thesis with ID ${id}`);
				throw new ConflictException(
					`Cannot delete published thesis. Please unpublish it first`,
				);
			}

			// Check if thesis is assigned to any group
			const assignedGroup = await this.prisma.group.findFirst({
				where: { thesisId: id },
			});

			if (assignedGroup) {
				this.logger.warn(
					`Cannot delete thesis with ID ${id} as it is assigned to group ${assignedGroup.id}`,
				);
				throw new ConflictException(
					`Cannot delete thesis as it is already assigned to a group`,
				);
			}

			const deletedThesis = await this.prisma.thesis.delete({
				where: { id },
				include: {
					thesisVersions: {
						select: { id: true, version: true, supportingDocument: true },
						orderBy: { version: 'desc' },
					},
				},
			});

			this.logger.log(`Thesis with ID: ${id} successfully deleted`);
			this.logger.debug('Deleted thesis detail', deletedThesis);

			return deletedThesis;
		} catch (error) {
			this.logger.error(`Error deleting thesis with ID ${id}`, error);

			throw error;
		}
	}
}
