import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { TIMEOUT } from '@/configs';
import { EmailJobDto } from '@/email/dto/email-job.dto';
import { ToggleLecturerStatusDto } from '@/lecturers/dto/toggle-lecturer-status.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UserService } from '@/users/user.service';

import { PrismaClient } from '~/generated/prisma';

@Injectable()
export class LecturerService {
	private readonly logger = new Logger(LecturerService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailQueueService,
	) {}

	async create(dto: CreateUserDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const { plainPassword, ...newUser } = await UserService.create(
					dto,
					prisma as PrismaClient,
					this.logger,
				);
				const userId = newUser.id;

				const lecturer = await prisma.lecturer.create({
					data: {
						userId,
					},
				});

				// Send welcome email with credentials
				const emailDto: EmailJobDto = {
					to: newUser.email,
					subject: 'Welcome to TheSync',
					context: {
						fullName: newUser.fullName,
						email: newUser.email,
						password: plainPassword,
					},
				};
				await this.email.sendEmail(
					EmailJobType.SEND_LECTURER_ACCOUNT,
					emailDto,
					500,
				);

				this.logger.log(`Lecturer created with ID: ${newUser.id}`);

				return {
					...newUser,
					isModerator: lecturer.isModerator,
				};
			});

			this.logger.log(`Lecturer created with ID: ${result.id}`);
			this.logger.debug('Lecturer detail', result);

			return result;
		} catch (error) {
			this.logger.error('Error creating lecturer', error);

			throw error;
		}
	}

	async findAll() {
		try {
			this.logger.log('Fetching all lecturers');

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

			this.logger.log(`Found ${formattedLecturers.length} lecturers`);
			this.logger.debug('Lecturers detail', formattedLecturers);

			return formattedLecturers;
		} catch (error) {
			this.logger.error('Error fetching lecturers', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			this.logger.log(`Fetching lecturer with ID: ${id}`);

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

				throw new NotFoundException(`Lecturer with ID ${id} not found`);
			}

			this.logger.log(`Lecturer found with ID: ${id}`);
			this.logger.debug('Lecturer detail', lecturer);

			return {
				...lecturer.user,
				isModerator: lecturer.isModerator,
			};
		} catch (error) {
			this.logger.error(`Error fetching lecturer with ID ${id}`, error);

			throw error;
		}
	}

	async update(id: string, dto: UpdateUserDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const existingLecturer = await prisma.lecturer.findUnique({
					where: { userId: id },
				});

				if (!existingLecturer) {
					this.logger.warn(`Lecturer with ID ${id} not found for update`);

					throw new NotFoundException(`Lecturer with ID ${id} not found`);
				}

				const updatedUser = await UserService.update(
					id,
					dto,
					prisma as PrismaClient,
					this.logger,
				);

				const updatedLecturer = await prisma.lecturer.findUnique({
					where: { userId: id },
				});

				return {
					...updatedUser,
					isModerator: updatedLecturer!.isModerator,
				};
			});

			this.logger.log(`Lecturer updated with ID: ${result.id}`);
			this.logger.debug('Updated Lecturer', result);

			return result;
		} catch (error) {
			this.logger.error(`Error updating lecturer with ID ${id}`, error);

			throw error;
		}
	}

	async createMany(dto: CreateUserDto[]) {
		try {
			const results = await this.prisma.$transaction(
				async (prisma) => {
					const createdLecturers: any[] = [];
					const emailsToSend: EmailJobDto[] = [];

					for (const createLecturerDto of dto) {
						// Create user
						const { plainPassword, ...newUser } = await UserService.create(
							createLecturerDto,
							prisma as PrismaClient,
							this.logger,
						);
						const userId = newUser.id;

						// Create lecturer
						const lecturer = await prisma.lecturer.create({
							data: {
								userId,
							},
						});

						const result = {
							...newUser,
							isModerator: lecturer.isModerator,
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

					// Send bulk emails after all lecturers are created successfully
					if (emailsToSend.length > 0) {
						await this.email.sendBulkEmails(
							EmailJobType.SEND_LECTURER_ACCOUNT,
							emailsToSend,
							500,
						);
					}

					return createdLecturers;
				},
				{ timeout: TIMEOUT },
			);

			this.logger.log(`Successfully created ${results.length} lecturers`);

			return results;
		} catch (error) {
			this.logger.error('Error creating lecturers in batch', error);

			throw error;
		}
	}

	async toggleStatus(id: string, dto: ToggleLecturerStatusDto) {
		try {
			const { isActive, isModerator } = dto;

			const result = await this.prisma.$transaction(async (prisma) => {
				const existingLecturer = await prisma.lecturer.findUnique({
					where: { userId: id },
					include: {
						user: true,
					},
				});

				if (!existingLecturer) {
					this.logger.warn(
						`Lecturer with ID ${id} not found for status toggle`,
					);

					throw new NotFoundException(`Lecturer with ID ${id} not found`);
				}

				const updatedUser = await prisma.user.update({
					where: { id },
					data: {
						isActive: isActive,
					},
					omit: {
						password: true,
					},
				});

				const updatedLecturer = await prisma.lecturer.update({
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

	private async validateLecturerDeletion(
		lecturerId: string,
		prisma: any,
	): Promise<void> {
		const [thesisOwner, supervisedThesis, reviewGroup] = await Promise.all([
			prisma.thesis.findFirst({
				where: { lecturerId },
				select: { id: true },
			}),
			prisma.supervision.findFirst({
				where: { lecturerId },
				select: { lecturerId: true, thesisId: true },
			}),
			prisma.review.findFirst({
				where: { lecturerId },
				select: { id: true },
			}),
		]);

		const constraints = [
			{
				condition: thesisOwner,
				message: 'Lecturer is linked to a thesis',
				logMessage: 'linked to thesis',
			},
			{
				condition: supervisedThesis,
				message: 'Lecturer is supervising group/thesis',
				logMessage: 'linked to group or thesis supervision',
			},
			{
				condition: reviewGroup,
				message: 'Lecturer is linked to a review group',
				logMessage: 'linked to review group',
			},
		];

		for (const constraint of constraints) {
			if (constraint.condition) {
				this.logger.warn(
					`Lecturer with ID ${lecturerId} is ${constraint.logMessage}, cannot delete`,
				);
				throw new BadRequestException(
					`${constraint.message}. Deletion not allowed. Please deactivate this account instead.`,
				);
			}
		}
	}

	async delete(id: string) {
		try {
			this.logger.log(`Deleting lecturer with ID: ${id}`);

			const result = await this.prisma.$transaction(async (prisma) => {
				const existingLecturer = await prisma.lecturer.findUnique({
					where: { userId: id },
					select: { userId: true, isModerator: true },
				});

				if (!existingLecturer) {
					this.logger.warn(`Lecturer with ID ${id} not found for deletion`);
					throw new NotFoundException(`Lecturer with ID ${id} not found`);
				}

				if (existingLecturer.isModerator) {
					this.logger.warn(
						`Lecturer with ID ${id} is a moderator, cannot delete`,
					);
					throw new BadRequestException(
						'Lecturer is a moderator. Deletion not allowed. Please deactivate this account instead.',
					);
				}

				await this.validateLecturerDeletion(existingLecturer.userId, prisma);

				const lecturerToDelete = await prisma.lecturer.findUnique({
					where: { userId: id },
					include: {
						user: {
							omit: {
								password: true,
							},
						},
					},
				});

				await prisma.lecturer.delete({
					where: { userId: id },
				});

				await prisma.user.delete({
					where: { id },
				});

				const deletedLecturerData = {
					...lecturerToDelete!.user,
					isModerator: lecturerToDelete!.isModerator,
				};

				this.logger.log(`Lecturer successfully deleted with ID: ${id}`);
				this.logger.debug('Deleted lecturer details:', {
					id: deletedLecturerData.id,
					email: deletedLecturerData.email,
					fullName: deletedLecturerData.fullName,
					isModerator: deletedLecturerData.isModerator,
				});

				return deletedLecturerData;
			});

			return result;
		} catch (error) {
			this.logger.error(
				`Error deleting lecturer with ID ${id}:`,
				error.message,
			);
			throw error;
		}
	}
}
