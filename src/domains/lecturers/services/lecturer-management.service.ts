import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CONSTANTS } from '@/configs';
import { ToggleLecturerStatusDto, UpdateLecturerDto } from '@/lecturers/dto';
import { mapLecturerV1, mapLecturerV3 } from '@/lecturers/mappers';
import { LecturerResponse } from '@/lecturers/responses';
import { PrismaService } from '@/providers';
import { CreateUserDto } from '@/users/index';

@Injectable()
export class LecturerManagementService {
	private readonly logger = new Logger(LecturerManagementService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(dto: CreateUserDto): Promise<LecturerResponse> {}

	async createMany(dtos: CreateUserDto[]): Promise<LecturerResponse[]> {}

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

			return result;
		} catch (error) {
			this.logger.error(`Error deleting lecturer with ID ${id}:`, error);

			throw error;
		}
	}

	private async ensureNoDependencies(lecturerId: string): Promise<void> {
		const counts = await this.prisma.$queryRaw<
			{
				supervisionCount: number;
				assignmentReviewCount: number;
				reviewCount: number;
				thesisCount: number;
			}[]
		>`
			SELECT
				COUNT(DISTINCT s.thesis_id) AS supervisionCount,
				COUNT(DISTINCT ar.submission_id) AS assignmentReviewCount,
				COUNT(DISTINCT r.id) AS reviewCount,
				COUNT(DISTINCT t.id) AS thesisCount
			FROM
				_supervisions s
			LEFT JOIN
				_assignment_reviews ar ON ar.reviewer_id = s.lecturer_id AND s.lecturer_id = ${lecturerId}
			LEFT JOIN
				reviews r ON r.lecturer_id = s.lecturer_id AND s.lecturer_id = ${lecturerId}
			LEFT JOIN
				theses t ON t.lecturer_id = s.lecturer_id AND s.lecturer_id = ${lecturerId}
			WHERE
				s.lecturer_id = ${lecturerId};
		`;

		const {
			supervisionCount,
			assignmentReviewCount,
			reviewCount,
			thesisCount,
		} = counts[0];

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
