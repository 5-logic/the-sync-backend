import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';

import { BaseCacheService } from '@/bases/base-cache.service';
import { CONSTANTS } from '@/configs';
import { EmailJobDto } from '@/email/dto/email-job.dto';
import { ToggleLecturerStatusDto, UpdateLecturerDto } from '@/lecturers/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import { CreateUserDto, UpdateUserDto } from '@/users/dto';
import { generateStrongPassword, hash } from '@/utils';

@Injectable()
export class LecturerService extends BaseCacheService {
	private static readonly CACHE_KEY = 'cache:lecturer';

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailQueueService,
		@Inject(CACHE_MANAGER) cacheManager: Cache,
	) {
		super(cacheManager, LecturerService.name);
	}

	async create(dto: CreateUserDto) {
		this.logger.log(`Creating lecturer with email: ${dto.email}`);

		try {
			let emailDto: EmailJobDto | undefined = undefined;

			const plainPassword = generateStrongPassword();
			const hashedPassword = await hash(plainPassword);

			const result = await this.prisma.$transaction(async (txn) => {
				const existingUser = await txn.user.findUnique({
					where: {
						email: dto.email,
					},
				});

				if (existingUser) {
					this.logger.warn(`Lecturer with email ${dto.email} already exists`);

					throw new ConflictException(
						`Lecturer with  email ${dto.email} already exists`,
					);
				}

				const newUser = await txn.user.create({
					data: {
						email: dto.email,
						fullName: dto.fullName,
						gender: dto.gender,
						phoneNumber: dto.phoneNumber,
						password: hashedPassword,
					},
					omit: {
						password: true,
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

				return {
					...newUser,
					isModerator: newLecturer.isModerator,
				};
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

			// Clear cache after successful creation
			await this.clearCache(`${LecturerService.CACHE_KEY}:all`);

			this.logger.log(`Lecturer created with ID: ${result.id}`);
			this.logger.debug('Lecturer detail', result);

			return result;
		} catch (error) {
			this.logger.error('Error creating lecturer', error);

			throw error;
		}
	}

	async findAll() {
		this.logger.log('Fetching all lecturers');

		try {
			// Check cache first
			const cacheKey = `${LecturerService.CACHE_KEY}:all`;
			const cachedLecturers = await this.getCachedData<any[]>(cacheKey);
			if (cachedLecturers) {
				this.logger.log(
					`Found ${cachedLecturers.length} lecturers (from cache)`,
				);
				return cachedLecturers;
			}

			const lecturers = await this.prisma.lecturer.findMany({
				include: {
					user: {
						omit: {
							password: true,
						},
					},
				},
				orderBy: {
					user: {
						createdAt: 'desc',
					},
				},
			});

			// Reuse the same data transformation logic from findOne
			const formattedLecturers = lecturers.map((lecturer) => ({
				...lecturer.user,
				isModerator: lecturer.isModerator,
			}));

			// Cache the result
			await this.setCachedData(cacheKey, formattedLecturers);

			this.logger.log(`Found ${formattedLecturers.length} lecturers`);
			this.logger.debug('Lecturers detail', formattedLecturers);

			return formattedLecturers;
		} catch (error) {
			this.logger.error('Error fetching lecturers', error);
			throw error;
		}
	}

	async findOne(id: string) {
		this.logger.log(`Fetching lecturer with ID: ${id}`);

		try {
			// Check cache first
			const cacheKey = `${LecturerService.CACHE_KEY}:${id}`;
			const cachedLecturer = await this.getCachedData<any>(cacheKey);
			if (cachedLecturer) {
				this.logger.log(`Lecturer found with ID: ${id} (from cache)`);
				return cachedLecturer;
			}

			const lecturer = await this.prisma.lecturer.findUnique({
				where: { userId: id },
				include: {
					user: {
						omit: {
							password: true,
						},
					},
				},
			});

			if (!lecturer) {
				this.logger.warn(`Lecturer with ID ${id} not found`);

				throw new NotFoundException(`Lecturer not found`);
			}

			const result = {
				...lecturer.user,
				isModerator: lecturer.isModerator,
			};

			// Cache the result
			await this.setCachedData(cacheKey, result);

			this.logger.log(`Lecturer found with ID: ${id}`);
			this.logger.debug('Lecturer detail', lecturer);

			return result;
		} catch (error) {
			this.logger.error(`Error fetching lecturer with ID ${id}`, error);

			throw error;
		}
	}

	async update(id: string, dto: UpdateUserDto) {
		this.logger.log(`Updating lecturer with ID: ${id}`);

		try {
			const result = await this.prisma.$transaction(async (txn) => {
				const existingLecturer = await txn.lecturer.findUnique({
					where: { userId: id },
				});

				if (!existingLecturer) {
					this.logger.warn(`Lecturer with ID ${id} not found for update`);

					throw new NotFoundException(`Lecturer not found`);
				}

				const updatedUser = await txn.user.update({
					where: { id: id },
					data: {
						fullName: dto.fullName,
						gender: dto.gender,
						phoneNumber: dto.phoneNumber,
					},
					omit: { password: true },
				});

				return {
					...updatedUser,
					isModerator: existingLecturer.isModerator,
				};
			});

			// Clear cache after successful update
			await this.clearCache(`${LecturerService.CACHE_KEY}:all`);
			await this.clearCache(`${LecturerService.CACHE_KEY}:${result.id}`);

			this.logger.log(`Lecturer updated with ID: ${result.id}`);
			this.logger.debug('Updated Lecturer', result);

			return result;
		} catch (error) {
			this.logger.error(`Error updating lecturer with ID ${id}`, error);

			throw error;
		}
	}

	async updateByAdmin(id: string, dto: UpdateLecturerDto) {
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
					omit: {
						password: true,
					},
				});

				return {
					...updatedLecturer,
					isModerator: updatedLecturer.lecturer!.isModerator,
				};
			});

			// Clear cache after successful update
			await this.clearCache(`${LecturerService.CACHE_KEY}:all`);
			await this.clearCache(`${LecturerService.CACHE_KEY}:${result.id}`);

			this.logger.log(`Lecturer updated with ID: ${result.id}`);
			this.logger.debug('Updated Lecturer', result);

			return result;
		} catch (error) {
			this.logger.error(`Error updating lecturer with ID ${id}`, error);

			throw error;
		}
	}

	async createMany(dto: CreateUserDto[]) {
		this.logger.log(`Creating lecturers in batch: ${dto.length} records`);

		try {
			const emailsToSend: EmailJobDto[] = [];

			const results = await this.prisma.$transaction(
				async (txn) => {
					const createdLecturers: any[] = [];

					for (const createLecturerDto of dto) {
						// Create user
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

						const newUser = await txn.user.create({
							data: {
								email: createLecturerDto.email,
								fullName: createLecturerDto.fullName,
								gender: createLecturerDto.gender,
								phoneNumber: createLecturerDto.phoneNumber,
								password: hashedPassword,
							},
							omit: {
								password: true,
							},
						});

						const newLecturer = await txn.lecturer.create({
							data: { userId: newUser.id },
						});

						const result = {
							...newUser,
							isModerator: newLecturer.isModerator,
						};

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
						this.logger.debug('Lecturer detail', result);
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

			// Clear cache after successful batch creation
			await this.clearCache(`${LecturerService.CACHE_KEY}:all`);

			this.logger.log(`Successfully created ${results.length} lecturers`);

			return results;
		} catch (error) {
			this.logger.error('Error creating lecturers in batch', error);

			throw error;
		}
	}

	async toggleStatus(id: string, dto: ToggleLecturerStatusDto) {
		this.logger.log(`Toggling status for lecturer with ID: ${id}`);

		try {
			const { isActive, isModerator } = dto;

			const result = await this.prisma.$transaction(async (txn) => {
				const existingLecturer = await txn.lecturer.findUnique({
					where: { userId: id },
					include: {
						user: true,
					},
				});

				if (!existingLecturer) {
					this.logger.warn(
						`Lecturer with ID ${id} not found for status toggle`,
					);

					throw new NotFoundException(`Lecturer not found`);
				}

				const updatedUser = await txn.user.update({
					where: { id },
					data: {
						isActive: isActive,
					},
					omit: {
						password: true,
					},
				});

				const updatedLecturer = await txn.lecturer.update({
					where: { userId: id },
					data: {
						isModerator: isModerator,
					},
				});

				return {
					...updatedUser,
					isModerator: updatedLecturer.isModerator,
				};
			});

			// Clear cache after successful status update
			await this.clearCache(`${LecturerService.CACHE_KEY}:all`);
			await this.clearCache(`${LecturerService.CACHE_KEY}:${id}`);

			this.logger.log(
				`Lecturer status updated - ID: ${id}, isActive: ${isActive}, isModerator: ${isModerator}`,
			);

			this.logger.debug('Updated lecturer status', result);

			return result;
		} catch (error) {
			this.logger.error(`Error toggling lecturer status with ID ${id}`, error);

			throw error;
		}
	}

	async delete(id: string) {
		try {
			this.logger.log(`Deleting lecturer with ID: ${id}`);

			const result = await this.prisma.$transaction(async (txn) => {
				const existingLecturer = await txn.lecturer.findUnique({
					where: { userId: id },
					select: {
						isModerator: true,
						supervisions: true,
						reviews: true,
						theses: true,
					},
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

				const constraints = [
					{
						condition: existingLecturer.theses.length > 0,
						message: 'Lecturer is linked to a thesis',
						logMessage: 'linked to thesis',
					},
					{
						condition: existingLecturer.supervisions.length > 0,
						message: 'Lecturer is supervising group/thesis',
						logMessage: 'linked to group or thesis supervision',
					},
					{
						condition: existingLecturer.reviews.length > 0,
						message: 'Lecturer is linked to a review group',
						logMessage: 'linked to review group',
					},
				];

				for (const constraint of constraints) {
					if (constraint.condition) {
						this.logger.warn(
							`Lecturer with ID ${id} is ${constraint.logMessage}, cannot delete`,
						);

						throw new ConflictException(
							`${constraint.message}. Deletion not allowed. Please deactivate this account instead.`,
						);
					}
				}

				const deletedLecturer = await txn.lecturer.delete({
					where: { userId: id },
				});

				const deletedUser = await txn.user.delete({
					where: { id },
					omit: {
						password: true,
					},
				});

				this.logger.log(`Lecturer successfully deleted with ID: ${id}`);
				this.logger.debug('Deleted lecturer details:', deletedLecturer);

				return { ...deletedUser, isModerator: deletedLecturer.isModerator };
			});

			// Clear cache after successful deletion
			await this.clearCache(`${LecturerService.CACHE_KEY}:all`);
			await this.clearCache(`${LecturerService.CACHE_KEY}:${id}`);

			return result;
		} catch (error) {
			this.logger.error(`Error deleting lecturer with ID ${id}:`, error);

			throw error;
		}
	}
}
