import {
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CONSTANTS } from '@/configs';
import { EmailJobDto } from '@/email/dto/email-job.dto';
import { ToggleLecturerStatusDto, UpdateLecturerDto } from '@/lecturers/dto';
import { LecturerResponse } from '@/lecturers/responses';
import { PrismaService } from '@/providers';
import { EmailQueueService } from '@/queue/email/email-queue.service';
import { EmailJobType } from '@/queue/email/enums/type.enum';
import { CreateUserDto, UpdateUserDto } from '@/users/dto';
import { generateStrongPassword, hash } from '@/utils';

@Injectable()
export class LecturerService {
	private readonly logger = new Logger(LecturerService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll(): Promise<LecturerResponse[]> {
		this.logger.log('Fetching all lecturers');

		try {
			const lecturers = await this.prisma.lecturer.findMany({
				include: {
					user: true,
				},
				orderBy: {
					user: {
						createdAt: 'desc',
					},
				},
			});

			// Transform data
			const formattedLecturers = lecturers.map((lecturer) => ({
				...lecturer.user,
				isModerator: lecturer.isModerator,
			}));

			this.logger.log(`Found ${formattedLecturers.length} lecturers`);
			return formattedLecturers;
		} catch (error) {
			this.logger.error('Error fetching lecturers', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<LecturerResponse> {
		this.logger.log(`Fetching lecturer with ID: ${id}`);

		try {
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

			this.logger.log(`Lecturer found with ID: ${id} (from DB)`);
			return result;
		} catch (error) {
			this.logger.error(`Error fetching lecturer with ID ${id}`, error);
			throw error;
		}
	}

	async update(id: string, dto: UpdateUserDto): Promise<LecturerResponse> {
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

			this.logger.log(`Lecturer updated with ID: ${result.id}`);
			this.logger.debug('Updated Lecturer', result);

			return result;
		} catch (error) {
			this.logger.error(`Error updating lecturer with ID ${id}`, error);

			throw error;
		}
	}
}
