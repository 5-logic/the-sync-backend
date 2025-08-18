import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CONSTANTS } from '@/configs';
import {
	// CacheHelperService,
	PrismaService,
} from '@/providers';
// import { CACHE_KEY } from '@/students/constants';
import { SelfUpdateStudentDto } from '@/students/dtos';
import { mapStudentDetailResponse } from '@/students/mappers';
import { StudentDetailResponse } from '@/students/responses';

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
	): Promise<StudentDetailResponse> {
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
					await txn.user.update({
						where: { id },
						data: {
							fullName: dto.fullName,
							gender: dto.gender,
							phoneNumber: dto.phoneNumber,
						},
					});

					// Update student responsibilities if provided
					if (dto.studentResponsibilities) {
						for (const r of dto.studentResponsibilities) {
							await txn.studentResponsibility.update({
								where: {
									studentId_responsibilityId: {
										responsibilityId: r.responsibilityId,
										studentId: id,
									},
								},
								data: {
									level: r.level,
								},
							});
						}
					}

					// Fetch the complete student data with all relations like in findOne
					const updatedStudent = await txn.student.findUnique({
						where: { userId: id },
						include: {
							user: true,
							major: true,
							enrollments: {
								include: {
									semester: true,
								},
								orderBy: {
									status: 'asc',
								},
							},
							studentResponsibilities: {
								include: {
									responsibility: true,
								},
							},
						},
					});

					if (!updatedStudent) {
						throw new NotFoundException(`Student not found after update`);
					}

					const result: StudentDetailResponse =
						mapStudentDetailResponse(updatedStudent);

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
