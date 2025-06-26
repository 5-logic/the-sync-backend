import { Injectable, Logger, NotFoundException } from '@nestjs/common';

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
				await this.email.sendEmail(EmailJobType.SEND_ACCOUNT, emailDto, 500);

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
							EmailJobType.SEND_ACCOUNT,
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
}
