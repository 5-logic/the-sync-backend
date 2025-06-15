import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CreateLecturerDto } from '@/lecturers/dto/create-lecturer.dto';
import { UpdateLecturerDto } from '@/lecturers/dto/update-lecturer.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { UserService } from '@/users/user.service';

@Injectable()
export class LecturerService {
	private readonly logger = new Logger(LecturerService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UserService,
	) {}

	async create(createLecturerDto: CreateLecturerDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const newUser = await this.userService.create(
					createLecturerDto.createUserDto,
					prisma,
				);
				const userId = newUser.id;

				const lecturer = await prisma.lecturer.create({
					data: {
						userId,
						isModerator: createLecturerDto.isModerator ?? false,
					},
				});

				return lecturer;
			});

			this.logger.log(`Lecturer created with userId: ${result.userId}`);
			this.logger.debug('Lecturer detail', result);

			return result;
		} catch (error) {
			this.logger.error('Error creating lecturer', error);
			throw error;
		}
	}

	async findAll() {
		try {
			const lecturers = await this.prisma.lecturer.findMany();

			this.logger.log(`Found ${lecturers.length} lecturers`);
			this.logger.debug('Lecturers detail', lecturers);

			return lecturers;
		} catch (error) {
			this.logger.error('Error fetching lecturers', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			this.logger.log(`Fetching user with id: ${id}`);

			const lecturer = await this.prisma.lecturer.findFirst({
				where: { userId: id },
			});

			if (!lecturer) {
				this.logger.warn(`Lecturer with userId ${id} not found`);
				throw new NotFoundException(`Lecturer with userId ${id} not found`);
			}

			this.logger.log(`Lecturer found with userId: ${id}`);
			this.logger.debug('Lecturer detail', lecturer);

			return lecturer;
		} catch (error) {
			this.logger.error(`Error fetching lecturer with userId ${id}`, error);
			throw error;
		}
	}

	async update(id: string, updateLecturerDto: UpdateLecturerDto) {
		try {
			const existingLecturer = await this.prisma.lecturer.findUnique({
				where: { userId: id },
			});

			if (!existingLecturer) {
				this.logger.warn(`Lecturer with userId ${id} not found for update`);
				throw new NotFoundException(`Lecturer with userId ${id} not found`);
			}

			const updatedLecturer = await this.prisma.lecturer.update({
				where: { userId: id },
				data: {
					isModerator: updateLecturerDto.isModerator,
				},
			});

			this.logger.log(
				`Lecturer updated with userId: ${updatedLecturer.userId}`,
			);
			this.logger.debug('Updated Lecturer', updatedLecturer);

			return updatedLecturer;
		} catch (error) {
			this.logger.error(`Error updating lecturer with userId ${id}`, error);
			throw error;
		}
	}

	async remove(id: string) {
		try {
			const deleted = await this.prisma.lecturer.delete({
				where: { userId: id },
			});

			this.logger.log(`Lecturer deleted with userId: ${id}`);
			this.logger.debug('Deleted Lecturer', deleted);

			return {
				status: 'success',
				message: `Lecturer with userId ${id} deleted successfully`,
			};
		} catch (error) {
			this.logger.error(`Error deleting lecturer with userId ${id}`, error);
			throw error;
		}
	}

	async createMany(createLecturerDtos: CreateLecturerDto[]) {
		const results: any[] = [];
		for (const dto of createLecturerDtos) {
			try {
				const result = await this.prisma.$transaction(async (prisma) => {
					const newUser = await this.userService.create(
						dto.createUserDto,
						prisma,
					);
					const userId = newUser.id;

					const existingLecturer = await prisma.lecturer.findUnique({
						where: { userId },
					});

					if (existingLecturer) {
						throw new ConflictException(
							`Lecturer with userId ${userId} already exists`,
						);
					}

					const lecturer = await prisma.lecturer.create({
						data: {
							userId,
							isModerator: dto.isModerator ?? false,
						},
					});

					return { lecturer };
				});

				this.logger.log(
					`Lecturer created with userId: ${result.lecturer.userId}`,
				);
				this.logger.debug('Lecturer detail', result.lecturer);

				results.push({ success: true, lecturer: result.lecturer });
			} catch (error) {
				this.logger.error('Error creating lecturer', error);
				results.push({
					success: false,
					error: error.message ?? error.toString(),
					dto,
				});
			}
		}
		return results;
	}
}
