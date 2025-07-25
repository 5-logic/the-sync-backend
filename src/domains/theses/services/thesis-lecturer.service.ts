import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CONSTANTS } from '@/configs';
import {
	// CacheHelperService,
	PrismaService,
} from '@/providers';
import { PineconeJobType, PineconeThesisService } from '@/queue';
// import { CACHE_KEY } from '@/theses/constants';
import { CreateThesisDto, UpdateThesisDto } from '@/theses/dtos';
import { mapThesis, mapThesisDetail } from '@/theses/mappers';
import { ThesisDetailResponse, ThesisResponse } from '@/theses/responses';

import { Skill, ThesisRequiredSkill, ThesisStatus } from '~/generated/prisma';

@Injectable()
export class ThesisLecturerService {
	private readonly logger = new Logger(ThesisLecturerService.name);

	private static readonly INITIAL_VERSION = 1;

	constructor(
		// private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
		private readonly pinecone: PineconeThesisService,
	) {}

	async create(
		lecturerId: string,
		dto: CreateThesisDto,
	): Promise<ThesisDetailResponse> {
		this.logger.log(`Creating thesis for lecturer with ID: ${lecturerId}`);

		try {
			// Validate skillIds if provided
			if (dto.skillIds && dto.skillIds.length > 0) {
				await this.validateSkillIds(dto.skillIds);
			}

			// Check maxThesesPerLecturer for this semester
			await this.validateSemesterAndThesisCount(lecturerId, dto.semesterId);

			const result = await this.prisma.$transaction(
				async (txn) => {
					// Create thesis
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

					// Create the first thesis version
					const firstThesisVersion = await txn.thesisVersion.create({
						data: {
							version: ThesisLecturerService.INITIAL_VERSION,
							supportingDocument: dto.supportingDocument,
							thesisId: thesis.id,
						},
					});

					//  Create first supervisor who create thí thesis
					await txn.supervision.create({
						data: {
							lecturerId,
							thesisId: thesis.id,
						},
					});

					// Create thesis required skills if skillIds provided
					let thesisRequiredSkills: (ThesisRequiredSkill & { skill: Skill })[] =
						[];
					if (dto.skillIds && dto.skillIds?.length > 0) {
						thesisRequiredSkills =
							await txn.thesisRequiredSkill.createManyAndReturn({
								data: dto.skillIds.map((skillId) => ({
									thesisId: thesis.id,
									skillId: skillId,
								})),
								include: { skill: true },
							});
					}

					const result: ThesisDetailResponse = mapThesisDetail({
						...thesis,
						thesisVersions: [firstThesisVersion],
						thesisRequiredSkills: thesisRequiredSkills,
					});

					// Return thesis with version and skills information
					return result;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(`Thesis created with ID: ${result?.id}`);
			this.logger.debug('New thesis detail', JSON.stringify(result));

			// await this.saveAndDeleteCache(result);

			// Upsert thesis into Pinecone
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
			// const cacheKey = `${CACHE_KEY}/lecturer/${lecturerId}`;
			// const cache =
			// 	await this.cache.getFromCache<ThesisDetailResponse[]>(cacheKey);
			// if (cache) {
			// 	this.logger.log('Returning theses from cache');

			// 	return cache;
			// }

			const theses = await this.prisma.thesis.findMany({
				where: { lecturerId: lecturerId },
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
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(
				`Found ${theses.length} theses for lecturer with ID: ${lecturerId}`,
			);
			this.logger.debug('Theses detail', JSON.stringify(theses));

			const result: ThesisDetailResponse[] = theses.map(mapThesisDetail);

			// await this.cache.saveToCache(cacheKey, result);

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
			// Lấy thesis, semester, group pick và phase
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

			// Logic kiểm tra quyền update và cập nhật status/publish
			let canUpdate = false;
			let shouldUpdateStatus = true;
			let shouldUpdatePublish = true;
			let newStatus: ThesisStatus | undefined = undefined;
			let newIsPublish: boolean | undefined = undefined;

			if (semester.status === 'Preparing') {
				// Chỉ lecturer tạo thesis mới được update
				if (existingThesis.lecturerId === userId) {
					canUpdate = true;
					// Nếu thesis đã được publish thì sẽ unpublish và chuyển status về Pending
					if (existingThesis.isPublish) {
						newIsPublish = false;
						newStatus = ThesisStatus.Pending;
					} else if (
						existingThesis.status === ThesisStatus.Approved ||
						existingThesis.status === ThesisStatus.Rejected
					) {
						newIsPublish = false;
						newStatus = ThesisStatus.Pending;
					} else {
						// Nếu không thì giữ nguyên status và publish hiện tại
						newIsPublish = existingThesis.isPublish;
						newStatus = existingThesis.status;
					}
				}
			} else if (
				(semester.status === 'Picking' || semester.status === 'Ongoing') &&
				semester.ongoingPhase === 'ScopeAdjustable' &&
				groupPicked
			) {
				// Chỉ leader của group pick thesis đó mới được update
				const leader = await this.prisma.studentGroupParticipation.findFirst({
					where: {
						groupId: groupPicked.id,
						studentId: userId,
						isLeader: true,
					},
				});
				if (leader) {
					canUpdate = true;
					// Không chuyển status và publish khi leader update
					shouldUpdateStatus = false;
					shouldUpdatePublish = false;
				}
			}

			if (!canUpdate) {
				this.logger.warn(
					`User with ID ${userId} is not authorized to update thesis with ID ${id}`,
				);
				throw new ForbiddenException(
					`You do not have permission to update this thesis`,
				);
			}

			// Validate skillIds if provided
			if (dto.skillIds && dto.skillIds.length > 0) {
				await this.validateSkillIds(dto.skillIds);
			}

			const result = await this.prisma.$transaction(async (txn) => {
				// If supportingDocument is provided, create a new version
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

				// Update thesis required skills if skillIds provided
				if (dto.skillIds && dto.skillIds.length > 0) {
					// Delete existing skills
					await txn.thesisRequiredSkill.deleteMany({
						where: { thesisId: id },
					});

					// Create new skills if any provided
					if (dto.skillIds && dto.skillIds.length > 0) {
						await txn.thesisRequiredSkill.createMany({
							data: dto.skillIds.map((skillId) => ({
								thesisId: id,
								skillId,
							})),
						});
					}

					this.logger.log(
						`Updated thesis required skills for thesis ID: ${id}. New skills count: ${dto.skillIds.length}`,
					);
				}

				// Chuẩn bị dữ liệu update
				const updateData: any = {
					englishName: dto.englishName,
					vietnameseName: dto.vietnameseName,
					abbreviation: dto.abbreviation,
					description: dto.description,
					domain: dto.domain,
				};
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

				const result: ThesisDetailResponse = mapThesisDetail(updateThesis);
				return result;
			});

			this.logger.log(`Thesis updated with ID: ${result.id}`);
			this.logger.debug('Updated thesis detail', JSON.stringify(result));

			// await this.saveAndDeleteCache(result);

			// Update thesis into Pinecone
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

			const updatedThesis = await this.prisma.thesis.update({
				where: { id },
				data: {
					status: ThesisStatus.Pending,
				},
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
				`Thesis with ID: ${id} successfully submitted for review. Status changed to Pending`,
			);
			this.logger.debug('Updated thesis detail', JSON.stringify(updatedThesis));

			const result: ThesisDetailResponse = mapThesisDetail(updatedThesis);

			// await this.saveAndDeleteCache(result);

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
					`Cannot delete thesis with current status. Only ${ThesisStatus.New} or ${ThesisStatus.Rejected} theses can be deleted`,
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

			// await this.saveAndDeleteCache(result);

			// Delete thesis from Pinecone
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

	// ------------------------------------------------------------------------------------------
	// Additional methods for thesis management can be added here
	// ------------------------------------------------------------------------------------------

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

	private async validateSemesterAndThesisCount(
		lecturerId: string,
		semesterId: string,
	): Promise<void> {
		// Validate that the semester exists
		const semester = await this.prisma.semester.findUnique({
			where: { id: semesterId },
		});

		if (!semester) {
			this.logger.warn(`Semester with ID ${semesterId} not found`);

			throw new NotFoundException(`Semester not found`);
		}

		// Validate that the lecturer has not exceeded the thesis limit for the semester
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
		// 1. Lecturer tạo thesis
		if (lecturerId === userId) return true;

		// 2. Supervisor của thesis
		const supervisor = await this.prisma.supervision.findFirst({
			where: { thesisId, lecturerId: userId },
		});
		if (supervisor) return true;

		// 3. Leader của group pick thesis
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

	// private async saveAndDeleteCache(
	// 	result: ThesisDetailResponse | ThesisResponse,
	// ) {
	// 	const cacheKey = `${CACHE_KEY}/${result.id}`;
	// 	await Promise.all([
	// 		this.cache.saveToCache(cacheKey, result),
	// 		this.cache.delete(`${CACHE_KEY}/`),
	// 		this.cache.delete(`${CACHE_KEY}/semester/${result.semesterId}`),
	// 		this.cache.delete(`${CACHE_KEY}/lecturer/${result.lecturerId}`),
	// 	]);
	// }
}
