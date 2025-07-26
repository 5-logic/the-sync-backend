import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CONSTANTS } from '@/configs';
// import { CACHE_KEY } from '@/lecturers/constants';
import { ToggleLecturerStatusDto, UpdateLecturerDto } from '@/lecturers/dtos';
import { mapLecturerV1, mapLecturerV3 } from '@/lecturers/mappers';
import { LecturerResponse } from '@/lecturers/responses';
import {
	// CacheHelperService,
	PrismaService,
} from '@/providers';
import { EmailJobDto, EmailJobType, EmailQueueService } from '@/queue';
import { CreateUserDto } from '@/users/index';
import { generateStrongPassword, hash } from '@/utils';

@Injectable()
export class LecturerManagementService {
	private readonly logger = new Logger(LecturerManagementService.name);

	constructor(
		// private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
		private readonly email: EmailQueueService,
	) {}

	async create(dto: CreateUserDto): Promise<LecturerResponse> {
		this.logger.log(`Creating lecturer with email: ${dto.email}`);

		try {
			// Validate duplicate email in system before create
			const existingUser = await this.prisma.user.findUnique({
				where: { email: dto.email },
			});
			if (existingUser) {
				this.logger.warn(`Lecturer with email ${dto.email} already exists`);
				throw new ConflictException(
					`Lecturer with email ${dto.email} already exists`,
				);
			}

			let emailDto: EmailJobDto | undefined = undefined;

			const plainPassword = generateStrongPassword();
			const hashedPassword = await hash(plainPassword);

			const result = await this.prisma.$transaction(async (txn) => {
				const newUser = await txn.user.create({
					data: {
						email: dto.email,
						fullName: dto.fullName,
						gender: dto.gender,
						phoneNumber: dto.phoneNumber,
						password: hashedPassword,
					},
				});

				const newLecturer = await txn.lecturer.create({
					data: { userId: newUser.id },
				});

				// Prepare email data
				emailDto = {
					to: newUser.email,
					subject: 'Welcome to TheSync',
					context: {
						fullName: newUser.fullName,
						email: newUser.email,
						password: plainPassword,
					},
				};

				const result: LecturerResponse = mapLecturerV1(newUser, newLecturer);

				return result;
			});

			// Send email after user and lecturer are created
			if (!emailDto) {
				this.logger.error('Email DTO is undefined, cannot send email');

				throw new Error('Email DTO is undefined');
			}

			await this.email.sendEmail(
				EmailJobType.SEND_LECTURER_ACCOUNT,
				emailDto,
				500,
			);

			this.logger.log(`Lecturer created with ID: ${result.id}`);
			this.logger.debug('Lecturer detail', JSON.stringify(result));

			// const cacheKey = `${CACHE_KEY}/${result.id}`;
			// await this.cache.saveToCache(cacheKey, result);
			// await this.cache.delete(`${CACHE_KEY}/`);

			return result;
		} catch (error) {
			this.logger.error('Error creating lecturer', error);

			throw error;
		}
	}

	async createMany(dto: CreateUserDto[]): Promise<LecturerResponse[]> {
		this.logger.log(`Creating lecturers in batch: ${dto.length} records`);

		try {
			// Validate duplicate emails in system before import
			const emails = dto.map((d) => d.email);
			const existingUsers = await this.prisma.user.findMany({
				where: { email: { in: emails } },
				select: { email: true },
			});
			if (existingUsers.length > 0) {
				const existEmails = existingUsers.map((u) => u.email).join(', ');
				throw new ConflictException(
					`The following emails already exist: ${existEmails}`,
				);
			}

			const emailsToSend: EmailJobDto[] = [];

			const results = await this.prisma.$transaction(
				async (txn) => {
					const createdLecturers: LecturerResponse[] = [];

					for (const createLecturerDto of dto) {
						// Check if user already exists
						const existingUser = await txn.user.findUnique({
							where: {
								email: createLecturerDto.email,
							},
						});

						if (existingUser) {
							this.logger.warn(
								`Lecturer with email ${createLecturerDto.email} already exists`,
							);

							throw new ConflictException(
								`Lecturer with email ${createLecturerDto.email} already exists`,
							);
						}

						const plainPassword = generateStrongPassword();
						const hashedPassword = await hash(plainPassword);

						// Create user
						const newUser = await txn.user.create({
							data: {
								email: createLecturerDto.email,
								fullName: createLecturerDto.fullName,
								gender: createLecturerDto.gender,
								phoneNumber: createLecturerDto.phoneNumber,
								password: hashedPassword,
							},
						});

						const newLecturer = await txn.lecturer.create({
							data: { userId: newUser.id },
						});

						const result: LecturerResponse = mapLecturerV1(
							newUser,
							newLecturer,
						);

						createdLecturers.push(result);

						// Prepare email data for bulk sending
						const emailDto: EmailJobDto = {
							to: newUser.email,
							subject: 'Welcome to TheSync',
							context: {
								fullName: newUser.fullName,
								email: newUser.email,
								password: plainPassword,
							},
						};
						emailsToSend.push(emailDto);

						this.logger.log(`Lecturer created with ID: ${result.id}`);
						this.logger.debug('Lecturer detail', JSON.stringify(result));
					}

					return createdLecturers;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			// Send bulk emails after all lecturers are created successfully
			if (emailsToSend.length > 0) {
				await this.email.sendBulkEmails(
					EmailJobType.SEND_LECTURER_ACCOUNT,
					emailsToSend,
					500,
				);
			}

			this.logger.log(`Successfully created ${results.length} lecturers`);

			// await this.cache.delete(`${CACHE_KEY}/`);

			return results;
		} catch (error) {
			this.logger.error('Error creating lecturers in batch', error);

			throw error;
		}
	}

	async updateByAdmin(
		id: string,
		dto: UpdateLecturerDto,
	): Promise<LecturerResponse> {
		this.logger.log(`Admin updating lecturer with ID: ${id}`);

		try {
			const result = await this.prisma.$transaction(async (txn) => {
				const existingLecturer = await txn.user.findUnique({
					where: { id: id },
				});

				if (!existingLecturer) {
					this.logger.warn(`Lecturer with ID ${id} not found for update`);

					throw new NotFoundException(`Lecturer not found`);
				}

				const updatedLecturer = await this.prisma.user.update({
					where: { id: id },
					data: {
						email: dto.email,
						fullName: dto.fullName,
						gender: dto.gender,
						phoneNumber: dto.phoneNumber,
					},
					include: {
						lecturer: true,
					},
				});

				const result: LecturerResponse = mapLecturerV3(updatedLecturer);

				// const cacheKey = `${CACHE_KEY}/${result.id}`;
				// await this.cache.saveToCache(cacheKey, result);
				// await this.cache.delete(`${CACHE_KEY}/`);

				return result;
			});

			this.logger.log(`Lecturer updated with ID: ${result.id}`);
			this.logger.debug('Updated Lecturer', JSON.stringify(result));

			return result;
		} catch (error) {
			this.logger.error(`Error updating lecturer with ID ${id}`, error);

			throw error;
		}
	}

	async toggleStatus(
		id: string,
		dto: ToggleLecturerStatusDto,
	): Promise<LecturerResponse> {
		this.logger.log(`Toggling status for lecturer with ID: ${id}`);

		try {
			const { isActive, isModerator } = dto;

			const result: LecturerResponse = await this.prisma.$transaction(
				async (txn) => {
					const existingLecturer = await txn.lecturer.findUnique({
						where: { userId: id },
						include: {
							user: true,
						},
					});

					if (!existingLecturer) {
						this.logger.warn(`Lecturer with ID ${id} not found`);

						throw new NotFoundException(`Lecturer not found`);
					}

					const updatedUser = await txn.user.update({
						where: { id },
						data: {
							isActive: isActive,
						},
					});

					const updatedLecturer = await txn.lecturer.update({
						where: { userId: id },
						data: {
							isModerator: isModerator,
						},
					});

					const result: LecturerResponse = mapLecturerV1(
						updatedUser,
						updatedLecturer,
					);

					return result;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(
				`Lecturer status updated - ID: ${id}, isActive: ${isActive}, isModerator: ${isModerator}`,
			);
			this.logger.debug('Updated lecturer status', JSON.stringify(result));

			// const cacheKey = `${CACHE_KEY}/${result.id}`;
			// await this.cache.saveToCache(cacheKey, result);
			// await this.cache.delete(`${CACHE_KEY}/`);

			return result;
		} catch (error) {
			this.logger.error(`Error toggling lecturer status with ID ${id}`, error);

			throw error;
		}
	}

	async remove(id: string): Promise<LecturerResponse> {
		this.logger.log(`Deleting lecturer with ID: ${id}`);

		try {
			const result = await this.prisma.$transaction(async (txn) => {
				const existingLecturer = await txn.lecturer.findUnique({
					where: { userId: id },
				});

				if (!existingLecturer) {
					this.logger.warn(`Lecturer with ID ${id} not found for deletion`);

					throw new NotFoundException(`Lecturer not found`);
				}

				if (existingLecturer.isModerator) {
					this.logger.warn(
						`Lecturer with ID ${id} is a moderator, cannot delete`,
					);

					throw new ConflictException(
						'Lecturer is a moderator. Deletion not allowed. Please deactivate this account instead.',
					);
				}

				await this.ensureNoDependencies(existingLecturer.userId);

				const deletedLecturer = await txn.lecturer.delete({
					where: { userId: id },
				});

				const deletedUser = await txn.user.delete({
					where: { id },
				});

				const result: LecturerResponse = mapLecturerV1(
					deletedUser,
					deletedLecturer,
				);

				return result;
			});

			this.logger.log(`Lecturer successfully deleted with ID: ${id}`);
			this.logger.debug('Deleted lecturer details:', JSON.stringify(result));

			// const cacheKey = `${CACHE_KEY}/${result.id}`;
			// await this.cache.delete(cacheKey);
			// await this.cache.delete(`${CACHE_KEY}/`);

			return result;
		} catch (error) {
			this.logger.error(`Error deleting lecturer with ID ${id}:`, error);

			throw error;
		}
	}

	// ------------------------------------------------------------------------------------------
	// Additional methods for lecturer management can be added here
	// ------------------------------------------------------------------------------------------

	private async ensureNoDependencies(lecturerId: string): Promise<void> {
		// Kiểm tra từng bảng liên quan trực tiếp foreign key tới lecturer
		const [supervisionCount, assignmentReviewCount, reviewCount, thesisCount] =
			await Promise.all([
				this.prisma.supervision.count({ where: { lecturerId: lecturerId } }),
				this.prisma.assignmentReview.count({
					where: { reviewerId: lecturerId },
				}),
				this.prisma.review.count({ where: { lecturerId: lecturerId } }),
				this.prisma.thesis.count({ where: { lecturerId: lecturerId } }),
			]);

		const hasRelations =
			supervisionCount > 0 ||
			assignmentReviewCount > 0 ||
			reviewCount > 0 ||
			thesisCount > 0;

		if (hasRelations) {
			this.logger.warn(`Lecturer ${lecturerId} has dependent relationships`);
			throw new ConflictException(
				`Cannot delete lecturer: it has related data.`,
			);
		}
	}
}
