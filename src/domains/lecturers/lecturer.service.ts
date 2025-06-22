import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CreateLecturerDto } from '@/lecturers/dto/create-lecturer.dto';
import { ToggleLecturerStatusDto } from '@/lecturers/dto/toggle-lecturer-status.dto';
import { UpdateLecturerDto } from '@/lecturers/dto/update-lecturer.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UserService } from '@/users/user.service';

import { PrismaClient } from '~/generated/prisma';

@Injectable()
export class LecturerService {
	private readonly logger = new Logger(LecturerService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createLecturerDto: CreateLecturerDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const createUserDto: CreateUserDto = {
					email: createLecturerDto.email,
					fullName: createLecturerDto.fullName,
					password: createLecturerDto.password,
					gender: createLecturerDto.gender,
					phoneNumber: createLecturerDto.phoneNumber,
				};

				// TODO: To send email to lecturer with their credentials
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { plainPassword, ...newUser } = await UserService.create(
					createUserDto,
					prisma as PrismaClient,
					this.logger,
				);
				const userId = newUser.id;

				const lecturer = await prisma.lecturer.create({
					data: {
						userId,
						isModerator: createLecturerDto.isModerator ?? false,
					},
				});

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

	async update(id: string, updateLecturerDto: UpdateLecturerDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const existingLecturer = await prisma.lecturer.findUnique({
					where: { userId: id },
				});

				if (!existingLecturer) {
					this.logger.warn(`Lecturer with ID ${id} not found for update`);

					throw new NotFoundException(`Lecturer with ID ${id} not found`);
				}

				const updateUserDto: UpdateUserDto = {
					fullName: updateLecturerDto.fullName,
					gender: updateLecturerDto.gender,
					phoneNumber: updateLecturerDto.phoneNumber,
				};

				const updatedUser = await UserService.update(
					id,
					updateUserDto,
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

	async createMany(createLecturerDtos: CreateLecturerDto[]) {
		try {
			const results = await this.prisma.$transaction(async (prisma) => {
				const createdLecturers: any[] = [];

				for (const createLecturerDto of createLecturerDtos) {
					// Create user DTO
					const createUserDto: CreateUserDto = {
						email: createLecturerDto.email,
						fullName: createLecturerDto.fullName,
						password: createLecturerDto.password,
						gender: createLecturerDto.gender,
						phoneNumber: createLecturerDto.phoneNumber,
					};

					// Create user
					// TODO: To send email to lecturer with their credentials
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { plainPassword, ...newUser } = await UserService.create(
						createUserDto,
						prisma as PrismaClient,
						this.logger,
					);
					const userId = newUser.id;

					// Create lecturer
					const lecturer = await prisma.lecturer.create({
						data: {
							userId,
							isModerator: createLecturerDto.isModerator ?? false,
						},
					});

					const result = {
						...newUser,
						isModerator: lecturer.isModerator,
					};

					createdLecturers.push(result);

					this.logger.log(`Lecturer created with ID: ${result.id}`);
					this.logger.debug('Lecturer detail', result);
				}

				return createdLecturers;
			});

			this.logger.log(`Successfully created ${results.length} lecturers`);

			return results;
		} catch (error) {
			this.logger.error('Error creating lecturers in batch', error);

			throw error;
		}
	}
	async toggleStatus(id: string, toggleDto: ToggleLecturerStatusDto) {
		try {
			const { isActive, isModerator } = toggleDto;

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
					data: { isActive },
					omit: {
						password: true,
					},
				});

				const updatedLecturer = await prisma.lecturer.update({
					where: { userId: id },
					data: {
						isModerator,
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
