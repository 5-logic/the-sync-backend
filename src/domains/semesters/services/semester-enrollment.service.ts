import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers';
import { UpdateEnrollmentsDto } from '@/semesters/dto';

import { Semester, SemesterStatus } from '~/generated/prisma';

@Injectable()
export class SemesterEnrollmentService {
	private readonly logger = new Logger(SemesterEnrollmentService.name);

	constructor(private readonly prisma: PrismaService) {}

	async update(id: string, dto: UpdateEnrollmentsDto) {
		this.logger.log(`Updating enrollments for semester ID: ${id}`);

		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id: id },
			});

			this.validateSemesterExists(semester);

			await this.prisma.enrollment.updateMany({
				where: {
					studentId: { in: dto.studentIds },
					semesterId: id,
				},
				data: {
					status: dto.status,
				},
			});

			return;
		} catch (error) {
			this.logger.error(
				`Failed to update enrollments for semester ID: ${id}`,
				error,
			);

			throw error;
		}
	}

	private validateSemesterExists(semester: Semester | null) {
		if (!semester) {
			const message = 'Semester not found';
			this.logger.warn(message);

			throw new NotFoundException(message);
		}

		if (semester.status !== SemesterStatus.Ongoing) {
			this.logger.warn(
				`Cannot update enrollments for semester ${semester.id}: status is ${semester.status}, must be ${SemesterStatus.Ongoing}`,
			);

			throw new ConflictException(
				`Cannot update enrollments: semester status must be ${SemesterStatus.Ongoing}`,
			);
		}
	}
}
