import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
	// CacheHelperService,
	PrismaService,
} from '@/providers';
// import { CACHE_KEY } from '@/students/constants';
import { mapStudentDetailResponse, mapStudentV2 } from '@/students/mappers';
import { StudentDetailResponse, StudentResponse } from '@/students/responses';

@Injectable()
export class StudentPublicService {
	private readonly logger = new Logger(StudentPublicService.name);

	constructor(
		// private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
	) {}

	async findAll(): Promise<StudentResponse[]> {
		this.logger.log('Fetching all students');

		try {
			// const cacheKey = `${CACHE_KEY}/`;
			// const cache = await this.cache.getFromCache<StudentResponse[]>(cacheKey);
			// if (cache) {
			// 	this.logger.log('Returning students from cache');

			// 	return cache;
			// }

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

			// await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error('Error fetching students', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<StudentDetailResponse> {
		this.logger.log(`Fetching student with ID: ${id}`);

		try {
			// const cacheKey = `${CACHE_KEY}/${id}`;
			// const cache =
			// 	await this.cache.getFromCache<StudentDetailResponse>(cacheKey);
			// if (cache) {
			// 	this.logger.log(`Returning student ${id} from cache`);

			// 	return cache;
			// }

			const student = await this.prisma.student.findUnique({
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
					studentSkills: {
						include: {
							skill: {
								include: { skillSet: true },
							},
						},
					},
					studentExpectedResponsibilities: {
						include: {
							responsibility: true,
						},
					},
				},
			});

			if (!student) {
				this.logger.warn(`Student with ID ${id} not found`);

				throw new NotFoundException(`Student not found`);
			}

			this.logger.log(`Student found with ID: ${id}`);
			this.logger.debug('Student detail', JSON.stringify(student));

			const result: StudentDetailResponse = mapStudentDetailResponse(student);

			// await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error(`Error fetching student with ID ${id}`, error);

			throw error;
		}
	}

	async findAllBySemester(semesterId: string): Promise<StudentResponse[]> {
		this.logger.log(`Fetching all students for semester: ${semesterId}`);

		try {
			// const cacheKey = `${CACHE_KEY}/semester/${semesterId}`;
			// const cache = await this.cache.getFromCache<StudentResponse[]>(cacheKey);
			// if (cache) {
			// 	this.logger.log('Returning students from cache');

			// 	return cache;
			// }

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

			// await this.cache.saveToCache(cacheKey, result);

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
