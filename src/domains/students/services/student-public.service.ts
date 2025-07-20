import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers';
import { mapStudentV2 } from '@/students/mappers';
import { StudentDetailResponse, StudentResponse } from '@/students/responses';

@Injectable()
export class StudentPublicService {
	private readonly logger = new Logger(StudentPublicService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findAll(): Promise<StudentResponse[]> {
		this.logger.log('Fetching all students');

		try {
			const students = await this.prisma.student.findMany({
				include: {
					user: true,
				},
				orderBy: {
					user: {
						createdAt: 'desc',
					},
				},
			});

			this.logger.log(`Found ${students.length} students`);
			this.logger.debug('Students detail', JSON.stringify(students));

			const result: StudentResponse[] = students.map(mapStudentV2);

			return result;
		} catch (error) {
			this.logger.error('Error fetching students', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<StudentDetailResponse> {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async findAllBySemester(semesterId: string): Promise<StudentResponse[]> {
		this.logger.log(`Fetching all students for semester: ${semesterId}`);

		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id: semesterId },
			});

			if (!semester) {
				throw new NotFoundException(`Semester not found`);
			}

			const enrollments = await this.prisma.enrollment.findMany({
				where: {
					semesterId: semesterId,
				},
				include: {
					student: {
						include: {
							user: true,
						},
					},
				},
				orderBy: {
					student: {
						user: {
							createdAt: 'desc',
						},
					},
				},
			});

			this.logger.log(
				`Found ${enrollments.length} students for semester ${semesterId}`,
			);
			this.logger.debug('Students detail', JSON.stringify(enrollments));

			const result: StudentResponse[] = enrollments.map((e) =>
				mapStudentV2(e.student),
			);

			return result;
		} catch (error) {
			this.logger.error(
				`Error fetching students for semester ${semesterId}`,
				error,
			);

			throw error;
		}
	}

	async findStudentsWithoutGroup(
		semesterId: string,
	): Promise<StudentResponse[]> {
		this.logger.log(
			`Fetching students without group for semester: ${semesterId}`,
		);

		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id: semesterId },
			});

			if (!semester) {
				throw new NotFoundException(`Semester not found`);
			}

			const studentsWithoutGroup = await this.prisma.student.findMany({
				where: {
					enrollments: {
						some: {
							semesterId: semesterId,
						},
					},
					studentGroupParticipations: {
						none: {
							semesterId: semesterId,
						},
					},
				},
				include: {
					user: true,
				},
				orderBy: {
					user: {
						createdAt: 'desc',
					},
				},
			});
			this.logger.log(
				`Found ${studentsWithoutGroup.length} students without group for semester ${semesterId}`,
			);
			this.logger.debug(
				'Students without group detail',
				JSON.stringify(studentsWithoutGroup),
			);

			const result: StudentResponse[] = studentsWithoutGroup.map((s) =>
				mapStudentV2(s),
			);

			return result;
		} catch (error) {
			this.logger.error(
				`Error fetching students without group for semester ${semesterId}`,
				error,
			);

			throw error;
		}
	}
}
