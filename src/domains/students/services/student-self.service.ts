import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CONSTANTS } from '@/configs';
import {
	// CacheHelperService,
	PrismaService,
} from '@/providers';
// import { CACHE_KEY } from '@/students/constants';
import { SelfUpdateStudentDto } from '@/students/dtos';
import { mapStudentV1 } from '@/students/mappers';
import { StudentResponse } from '@/students/responses';

@Injectable()
export class StudentSelfService {
	private readonly logger = new Logger(StudentSelfService.name);

	constructor(
		// private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
	) {}

	async update(
		id: string,
		dto: SelfUpdateStudentDto,
	): Promise<StudentResponse> {
		this.logger.log(`Updating student with ID: ${id}`);

		try {
			const result = await this.prisma.$transaction(
				async (txn) => {
					const existingStudent = await txn.student.findUnique({
						where: { userId: id },
					});

					if (!existingStudent) {
						this.logger.warn(`Student with ID ${id} not found for update`);

						throw new NotFoundException(`Student not found`);
					}

					// Update user information
					const updatedUser = await txn.user.update({
						where: { id },
						data: {
							fullName: dto.fullName,
							gender: dto.gender,
							phoneNumber: dto.phoneNumber,
						},
					});

					// Update student responsibilities if provided
					if (dto.studentResponsibilities) {
						await txn.studentResponsibility.updateMany({
							where: { studentId: id },
							data: dto.studentResponsibilities.map((responsibility) => ({
								responsibilityId: responsibility.responsibilityId,
								level: responsibility.level,
							})),
						});
					}

					const result: StudentResponse = mapStudentV1(
						updatedUser,
						existingStudent,
					);

					return result;
				},
				{ timeout: CONSTANTS.TIMEOUT },
			);

			this.logger.log(`Student updated with ID: ${result.id}`);
			this.logger.debug('Updated Student', JSON.stringify(result));

			// const cacheKey = `${CACHE_KEY}/${id}`;
			// await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error(`Error updating student with ID ${id}`, error);

			throw error;
		}
	}
}
