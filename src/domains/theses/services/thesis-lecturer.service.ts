import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CONSTANTS } from '@/configs';
import { PrismaService } from '@/providers';
import {
	EmailJobType,
	EmailQueueService,
	PineconeJobType,
	PineconeThesisService,
} from '@/queue';
import {
	AssignThesisDto,
	CreateThesisDto,
	UpdateThesisDto,
} from '@/theses/dtos';
import { mapThesis, mapThesisDetail } from '@/theses/mappers';
import { ThesisDetailResponse, ThesisResponse } from '@/theses/responses';

import { ThesisStatus } from '~/generated/prisma';

@Injectable()
export class ThesisLecturerService {
	private readonly logger = new Logger(ThesisLecturerService.name);

	private static readonly INITIAL_VERSION = 1;

	constructor(
		private readonly prisma: PrismaService,
		private readonly pinecone: PineconeThesisService,
		private readonly emailQueueService: EmailQueueService,
	) {}

	async create(
		lecturerId: string,
		dto: CreateThesisDto,
	): Promise<ThesisDetailResponse> {
		this.logger.log(`Creating thesis for lecturer with ID: ${lecturerId}`);

		try {
			await this.validateSemesterAndThesisCount(lecturerId, dto.semesterId);

			const result = await this.prisma.$transaction(
				async (txn) => {
					const thesis = await txn.thesis.create({
						data: {
							englishName: dto.englishName,
							vietnameseName: dto.vietnameseName,
							abbreviation: dto.abbreviation,
							description: dto.description,
							domain: dto.domain,
							lecturerId,
							semesterId: dto.semesterId,
						},
						include: {
							lecturer: { include: { user: true } },
						},
					});

					const firstThesisVersion = await txn.thesisVersion.create({
						data: {
							version: ThesisLecturerService.INITIAL_VERSION,
							supportingDocument: dto.supportingDocument,
							thesisId: thesis.id,
						},
					});

					await txn.supervision.create({
						data: {
							lecturerId,
							thesisId: thesis.id,
						},
					});

					const result: ThesisDetailResponse = mapThesisDetail({
						...thesis,
						thesisVersions: [firstThesisVersion],
					});

					return result;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(`Thesis created with ID: ${result?.id}`);
			this.logger.debug('New thesis detail', JSON.stringify(result));

			await this.pinecone.processThesis(
				PineconeJobType.CREATE_OR_UPDATE,
				result,
				500,
			);

			return result;
		} catch (error) {
			this.logger.error('Error creating thesis', error);

			throw error;
		}
	}

	async findAllByLecturerId(
		lecturerId: string,
	): Promise<ThesisDetailResponse[]> {
		this.logger.log(`Fetching all theses for lecturer with ID: ${lecturerId}`);

		try {
			const theses = await this.prisma.thesis.findMany({
				where: { lecturerId: lecturerId },
				include: {
					thesisVersions: {
						orderBy: { version: 'desc' },
					},
					lecturer: {
						include: { user: true },
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(
				`Found ${theses.length} theses for lecturer with ID: ${lecturerId}`,
			);
			this.logger.debug('Theses detail', JSON.stringify(theses));

			const result: ThesisDetailResponse[] = theses.map(mapThesisDetail);

			return result;
		} catch (error) {
			this.logger.error(
				`Error fetching theses for lecturer with ID ${lecturerId}`,
				error,
			);

			throw error;
		}
	}

	async update(
		userId: string,
		id: string,
		dto: UpdateThesisDto,
	): Promise<ThesisDetailResponse> {
		this.logger.log(
			`Updating thesis with ID: ${id} by user with ID: ${userId}`,
		);

		try {
			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
				include: {
					thesisVersions: {
						select: { version: true },
						orderBy: { version: 'desc' },
						take: 1,
					},
					semester: true,
					group: true,
				},
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with ID ${id} not found for update`);
				throw new NotFoundException(`Thesis not found`);
			}

			const semester = existingThesis.semester;
			const groupPicked = existingThesis.group;

			const {
				canUpdate,
				shouldUpdateStatus,
				shouldUpdatePublish,
				newStatus,
				newIsPublish,
			} = await this.getUpdatePermissions(
				userId,
				existingThesis,
				semester,
				groupPicked,
			);

			if (!canUpdate) {
				this.logger.warn(
					`User with ID ${userId} is not authorized to update thesis with ID ${id}`,
				);
				throw new ForbiddenException(
					`You do not have permission to update this thesis`,
				);
			}

			if (dto.semesterId) {
				await this.validateSemesterChange(id, existingThesis, dto.semesterId);
			}

			const result = await this.prisma.$transaction(
				async (txn) => {
					if (dto.supportingDocument) {
						const latestVersion =
							existingThesis.thesisVersions[0]?.version ??
							ThesisLecturerService.INITIAL_VERSION;
						const newVersion = latestVersion + 1;

						await txn.thesisVersion.create({
							data: {
								version: newVersion,
								supportingDocument: dto.supportingDocument,
								thesisId: id,
							},
						});

						this.logger.log(
							`Created new thesis version ${newVersion} for thesis ID: ${id}`,
						);
					}

					const updateData: any = {
						englishName: dto.englishName,
						vietnameseName: dto.vietnameseName,
						abbreviation: dto.abbreviation,
						description: dto.description,
						domain: dto.domain,
					};

					if (dto.semesterId && dto.semesterId !== existingThesis.semesterId) {
						updateData.semesterId = dto.semesterId;
						this.logger.log(
							`Thesis ${id} semester changed from ${existingThesis.semesterId} to ${dto.semesterId}`,
						);
					}

					if (shouldUpdateStatus) {
						updateData.status = newStatus ?? existingThesis.status;
					}
					if (shouldUpdatePublish) {
						updateData.isPublish =
							typeof newIsPublish === 'boolean'
								? newIsPublish
								: existingThesis.isPublish;
					}

					const updateThesis = await txn.thesis.update({
						where: { id: id },
						data: updateData,
						include: {
							thesisVersions: {
								orderBy: { version: 'desc' },
							},
							lecturer: {
								include: { user: true },
							},
						},
					});

					const result: ThesisDetailResponse = mapThesisDetail(updateThesis);
					return result;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(`Thesis updated with ID: ${result.id}`);
			this.logger.debug('Updated thesis detail', JSON.stringify(result));

			await this.pinecone.processThesis(
				PineconeJobType.CREATE_OR_UPDATE,
				result,
				500,
			);

			return result;
		} catch (error) {
			this.logger.error(`Error updating thesis with ID ${id}`, error);
			throw error;
		}
	}

	private async getUpdatePermissions(
		userId: string,
		existingThesis: any,
		semester: any,
		groupPicked: any,
	) {
		let canUpdate = false;
		let shouldUpdateStatus = true;
		let shouldUpdatePublish = true;
		let newStatus: ThesisStatus | undefined = undefined;
		let newIsPublish: boolean | undefined = undefined;

		if (semester.status === 'Preparing') {
			if (existingThesis.lecturerId === userId) {
				canUpdate = true;
				if (
					existingThesis.isPublish ||
					existingThesis.status === ThesisStatus.Approved ||
					existingThesis.status === ThesisStatus.Rejected
				) {
					newIsPublish = false;
					newStatus = ThesisStatus.Pending;
				} else {
					newIsPublish = existingThesis.isPublish;
					newStatus = existingThesis.status;
				}
			}
		} else if (semester.status === 'Picking') {
			if (groupPicked) {
				const leader = await this.prisma.studentGroupParticipation.findFirst({
					where: {
						groupId: groupPicked.id,
						studentId: userId,
						isLeader: true,
					},
				});
				if (leader) {
					canUpdate = true;
					shouldUpdateStatus = false;
					shouldUpdatePublish = false;
				}
			} else if (existingThesis.lecturerId === userId) {
				canUpdate = true;
				newStatus = ThesisStatus.Pending;
				newIsPublish = false;
			}
		} else if (semester.status === 'Ongoing') {
			if (groupPicked) {
				if (semester.ongoingPhase === 'ScopeAdjustable') {
					const leader = await this.prisma.studentGroupParticipation.findFirst({
						where: {
							groupId: groupPicked.id,
							studentId: userId,
							isLeader: true,
						},
					});
					if (leader) {
						canUpdate = true;
						shouldUpdateStatus = false;
						shouldUpdatePublish = false;
					}
				}
			} else if (existingThesis.lecturerId === userId) {
				canUpdate = true;
				newStatus = ThesisStatus.Pending;
				newIsPublish = false;
			}
		}
		return {
			canUpdate,
			shouldUpdateStatus,
			shouldUpdatePublish,
			newStatus,
			newIsPublish,
		};
	}

	async submitForReview(
		lecturerId: string,
		id: string,
	): Promise<ThesisDetailResponse> {
		this.logger.log(
			`Submitting thesis with ID: ${id} for review by lecturer with ID: ${lecturerId}`,
		);

		try {
			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id: id },
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

			const updatedThesis = await this.prisma.thesis.update({
				where: { id },
				data: {
					status: ThesisStatus.Pending,
				},
				include: {
					thesisVersions: {
						orderBy: { version: 'desc' },
					},
					lecturer: {
						include: { user: true },
					},
				},
			});

			this.logger.log(
				`Thesis with ID: ${id} successfully submitted for review. Status changed to Pending`,
			);
			this.logger.debug('Updated thesis detail', JSON.stringify(updatedThesis));

			const result: ThesisDetailResponse = mapThesisDetail(updatedThesis);

			await this.sendThesisStatusChangeNotification(
				updatedThesis,
				ThesisStatus.Pending,
			);

			return result;
		} catch (error) {
			this.logger.error(
				`Error submitting thesis with ID ${id} for review`,
				error,
			);

			throw error;
		}
	}

	async remove(lecturerId: string, id: string): Promise<ThesisResponse> {
		this.logger.log(
			`Attempting to delete thesis with ID: ${id} by lecturer with ID: ${lecturerId}`,
		);

		try {
			const existingThesis = await this.prisma.thesis.findUnique({
				where: { id },
			});

			if (!existingThesis) {
				this.logger.warn(`Thesis with ID ${id} not found for deletion`);

				throw new NotFoundException(`Thesis not found`);
			}

			if (existingThesis.lecturerId !== lecturerId) {
				this.logger.warn(
					`Lecturer with ID ${lecturerId} is not authorized to delete thesis with ID ${id}`,
				);

				throw new ForbiddenException(
					`You do not have permission to delete this thesis`,
				);
			}

			if (
				existingThesis.status !== ThesisStatus.New &&
				existingThesis.status !== ThesisStatus.Rejected
			) {
				this.logger.warn(
					`Cannot delete thesis with status ${existingThesis.status}`,
				);

				throw new ConflictException(
					`Cannot delete thesis with current status. Only ${ThesisStatus.New} or ${ThesisStatus.Rejected} theses can be deleted`,
				);
			}

			if (existingThesis.isPublish) {
				this.logger.warn(`Cannot delete published thesis with ID ${id}`);

				throw new ConflictException(
					`Cannot delete published thesis. Please unpublish it first`,
				);
			}

			if (existingThesis.groupId) {
				this.logger.warn(
					`Cannot delete thesis with ID ${id} as it is assigned to group ${existingThesis.groupId}`,
				);

				throw new ConflictException(
					`Cannot delete thesis as it is already assigned to a group`,
				);
			}

			const deletedThesis = await this.prisma.thesis.delete({
				where: { id },
			});

			this.logger.log(`Thesis with ID: ${id} successfully deleted`);
			this.logger.debug('Deleted thesis detail', JSON.stringify(deletedThesis));

			const result: ThesisResponse = mapThesis(deletedThesis);

			await this.pinecone.processThesis(
				PineconeJobType.DELETE,
				deletedThesis.id,
				500,
			);

			return result;
		} catch (error) {
			this.logger.error(`Error deleting thesis with ID ${id}`, error);

			throw error;
		}
	}

	private async validateSemesterAndThesisCount(
		lecturerId: string,
		semesterId: string,
	): Promise<void> {
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});

		if (!semester) {
			this.logger.warn(`Semester with ID ${semesterId} not found`);

			throw new NotFoundException(`Semester not found`);
		}

		const thesisCount = await this.prisma.thesis.count({
			where: {
				lecturerId,
				semesterId,
			},
		});

		if (thesisCount >= semester.maxThesesPerLecturer) {
			this.logger.warn(
				`Lecturer with ID ${lecturerId} has exceeded the thesis limit for semester ${semesterId}`,
			);

			throw new ConflictException('Thesis limit exceeded for this semester');
		}
	}

	private async validatePermissionUpdateThesis(
		userId: string,
		thesisId: string,
		lecturerId: string,
	): Promise<boolean> {
		if (lecturerId === userId) return true;

		const supervisor = await this.prisma.supervision.findFirst({
			where: { thesisId, lecturerId: userId },
		});
		if (supervisor) return true;

		const groupPicked = await this.prisma.group.findFirst({
			where: { thesisId },
		});
		if (groupPicked) {
			const leader = await this.prisma.studentGroupParticipation.findFirst({
				where: {
					groupId: groupPicked.id,
					studentId: userId,
					isLeader: true,
				},
			});
			if (leader) return true;
		}
		return false;
	}

	/**
	 * Validate semester change for thesis update
	 */
	private async validateSemesterChange(
		thesisId: string,
		existingThesis: any,
		newSemesterId: string,
	): Promise<void> {
		if (existingThesis.semesterId === newSemesterId) {
			return;
		}

		if (existingThesis.groupId) {
			this.logger.warn(
				`Cannot change semester for thesis ${thesisId}: thesis is already picked by group ${existingThesis.groupId}`,
			);
			throw new ConflictException(
				'Cannot change semester for thesis that has been picked by a group',
			);
		}

		const newSemester = await this.prisma.semester.findUnique({
			where: { id: newSemesterId },
		});

		if (!newSemester) {
			this.logger.warn(`Semester ${newSemesterId} not found`);
			throw new NotFoundException('Target semester not found');
		}

		if (newSemester.maxThesesPerLecturer) {
			const lecturerThesesCount = await this.prisma.thesis.count({
				where: {
					lecturerId: existingThesis.lecturerId,
					semesterId: newSemesterId,
				},
			});

			if (lecturerThesesCount >= newSemester.maxThesesPerLecturer) {
				this.logger.warn(
					`Cannot move thesis to semester ${newSemesterId}: lecturer ${existingThesis.lecturerId} has reached maximum theses limit (${newSemester.maxThesesPerLecturer})`,
				);
				throw new ConflictException(
					`Cannot move thesis to target semester: lecturer has reached maximum theses limit (${newSemester.maxThesesPerLecturer})`,
				);
			}
		}

		this.logger.log(
			`Semester change validation passed for thesis ${thesisId}: ${existingThesis.semesterId} -> ${newSemesterId}`,
		);
	}

	/**
	 * Send email notification for thesis status change (single thesis)
	 */
	private async sendThesisStatusChangeNotification(
		thesis: any,
		status: ThesisStatus,
	): Promise<void> {
		try {
			if (!thesis.lecturer.user.email) {
				this.logger.warn(`No email found for lecturer ${thesis.lecturerId}`);
				return;
			}

			const emailContext = {
				lecturerName: thesis.lecturer.user.fullName,
				englishName: thesis.englishName,
				vietnameseName: thesis.vietnameseName,
				abbreviation: thesis.abbreviation,
				domain: thesis.domain,
				status: status,
				isPublicationChange: false,
			};

			const statusText =
				status === 'Pending' ? 'submitted for review' : status.toLowerCase();
			const subject = `Thesis Status Update - ${thesis.englishName} ${statusText}`;

			await this.emailQueueService.sendEmail(
				EmailJobType.SEND_THESIS_STATUS_CHANGE,
				{
					to: thesis.lecturer.user.email,
					subject: subject,
					context: emailContext,
				},
				500,
			);

			this.logger.log(
				`Thesis status change notification sent to ${thesis.lecturer.user.email} for thesis ${thesis.id}`,
			);
		} catch (error) {
			this.logger.error(
				'Failed to send thesis status change notification',
				error,
			);
		}
	}

	async assignThesis(
		userId: string,
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

			// Validate lecturer permission to assign thesis
			const lecturer = await this.prisma.lecturer.findUnique({
				where: { userId },
			});

			if (!lecturer) {
				this.logger.warn(`Lecturer with ID ${userId} not found`);
				throw new NotFoundException(`Lecturer not found`);
			}

			// Validate thesis supervision requirements
			// Check if the thesis has at least 2 supervisors before allowing assignment
			const supervisors = await this.prisma.supervision.findMany({
				where: {
					thesisId: id,
				},
				include: {
					lecturer: {
						include: {
							user: true,
						},
					},
				},
			});

			if (supervisors.length < 2) {
				this.logger.warn(
					`Thesis with ID ${id} does not have enough supervisors (${supervisors.length}/2) for assignment`,
				);
				throw new ConflictException(
					`This thesis must have at least 2 supervisors before it can be assigned to a group`,
				);
			}

			// If lecturer is not a moderator, they must be one of the supervisors
			if (!lecturer.isModerator) {
				const isSupervising = supervisors.some(
					(supervision) => supervision.lecturerId === userId,
				);

				if (!isSupervising) {
					this.logger.warn(
						`Lecturer with ID ${userId} is not authorized to assign thesis with ID ${id} - not a supervisor`,
					);
					throw new ForbiddenException(
						`You can only assign theses that you supervise`,
					);
				}
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

			// Update Pinecone metadata with new group assignment
			await this.pinecone.processThesisMetadata(
				id,
				{ groupId: dto.groupId },
				500,
			);

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
}
