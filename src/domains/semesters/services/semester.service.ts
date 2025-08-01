import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import {
	// CacheHelperService,
	PrismaService,
} from '@/providers';
// import { CACHE_KEY } from '@/semesters/constants';
import { CreateSemesterDto, UpdateSemesterDto } from '@/semesters/dto';
import { mapSemester } from '@/semesters/mappers';
import { SemesterResponse } from '@/semesters/responses';
import { SemesterStatusService } from '@/semesters/services/semester-status.service';

@Injectable()
export class SemesterService {
	private readonly logger = new Logger(SemesterService.name);

	constructor(
		// private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
		private readonly statusService: SemesterStatusService,
	) {}

	async create(dto: CreateSemesterDto): Promise<SemesterResponse> {
		this.logger.log('Starting semester creation process');

		try {
			if (
				dto.defaultThesesPerLecturer != null &&
				dto.maxThesesPerLecturer != null &&
				dto.defaultThesesPerLecturer > dto.maxThesesPerLecturer
			) {
				this.logger.warn(
					`Default Theses Per Lecturer (${dto.defaultThesesPerLecturer}) must be less or equal to Max Theses Per Lecturer (${dto.maxThesesPerLecturer})`,
				);
				throw new ConflictException(
					'Default Theses Per Lecturer must be less or equal to Max Theses Per Lecturer',
				);
			}

			await this.ensureNoDuplicate(dto.name, dto.code);

			await this.statusService.ensureNoActiveSemesterOrScopeLocked();

			const newSemester = await this.prisma.semester.create({
				data: {
					code: dto.code,
					name: dto.name,
					maxGroup: dto.maxGroup,
					defaultThesesPerLecturer: dto.defaultThesesPerLecturer,
					maxThesesPerLecturer: dto.maxThesesPerLecturer,
				},
			});

			this.logger.log(
				`Semester created successfully with ID: ${newSemester.id}`,
			);
			this.logger.debug('New semester details', JSON.stringify(newSemester));

			const result: SemesterResponse = mapSemester(newSemester);

			// const cacheKey = `${CACHE_KEY}/${newSemester.id}`;
			// await this.cache.saveToCache(cacheKey, result);
			// await this.cache.delete(`${CACHE_KEY}/`);

			return result;
		} catch (error) {
			this.logger.error('Error creating semester', error);

			throw error;
		}
	}

	async findAll(): Promise<SemesterResponse[]> {
		this.logger.log('Retrieving all semesters');

		try {
			// const cacheKey = `${CACHE_KEY}/`;
			// const cache = await this.cache.getFromCache<SemesterResponse[]>(cacheKey);
			// if (cache) {
			// 	this.logger.log('Returning cached semesters');

			// 	return cache;
			// }

			const semesters = await this.prisma.semester.findMany({
				orderBy: { createdAt: 'desc' },
			});

			this.logger.log(`Found ${semesters.length} semesters`);
			this.logger.debug('Semesters details', JSON.stringify(semesters));

			const result: SemesterResponse[] = semesters.map(mapSemester);

			// await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error('Error retrieving semesters', error);

			throw error;
		}
	}

	async findOne(id: string): Promise<SemesterResponse> {
		this.logger.log(`Fetching semester with ID: ${id}`);

		try {
			// const cacheKey = `${CACHE_KEY}/${id}`;
			// const cache = await this.cache.getFromCache<SemesterResponse>(cacheKey);
			// if (cache) {
			// 	this.logger.log(`Returning cached semester with id: ${id}`);

			// 	return cache;
			// }

			const semester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!semester) {
				this.logger.warn(`Semester with ID ${id} not found`);

				throw new NotFoundException(`Semester not found`);
			}

			this.logger.log(`Semester with ID ${id} retrieved successfully`);
			this.logger.debug('Semester details', JSON.stringify(semester));

			const result: SemesterResponse = mapSemester(semester);

			// await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error('Error fetching semester:', error);

			throw error;
		}
	}

	async findGroups(id: string) {
		this.logger.log(`Fetching groups for semester with ID: ${id}`);
		try {
			const groups = await this.prisma.group.findMany({
				where: { semesterId: id },
				include: {
					thesis: {
						include: {
							lecturer: {
								include: { user: true },
							},
							supervisions: {
								include: {
									lecturer: {
										include: { user: true },
									},
								},
							},
						},
					},
					studentGroupParticipations: {
						include: {
							student: {
								include: {
									user: true,
									major: true,
									enrollments: {
										where: { semesterId: id },
									},
								},
							},
						},
					},
				},
			});

			if (!groups || groups.length === 0) {
				this.logger.warn(`No groups found for semester with ID ${id}`);
			}

			this.logger.log(`Found ${groups.length} groups for semester ${id}`);
			this.logger.debug('Groups details', JSON.stringify(groups));

			return groups;
		} catch (error) {
			this.logger.error('Error fetching groups for semester:', error);

			throw error;
		}
	}

	async getStatistics(semesterId: string) {
		try {
			// Summary card
			const [totalStudents, totalLecturers, totalTheses, totalGroups] =
				await Promise.all([
					this.prisma.student.count({
						where: {
							enrollments: {
								some: { semesterId },
							},
						},
					}),
					this.prisma.lecturer.count(),
					this.prisma.thesis.count({ where: { semesterId } }),
					this.prisma.group.count({ where: { semesterId } }),
				]);

			// Semester Progress Overview
			// Tổng sinh viên đã vào group (có studentGroupParticipations trong semester)
			const totalStudentGrouped =
				await this.prisma.studentGroupParticipation.count({
					where: {
						group: { semesterId },
					},
				});

			// Tổng group đã pick thesis (group có thesisId != null)
			const totalGroupPickedThesis = await this.prisma.group.count({
				where: {
					semesterId,
					thesisId: { not: null },
				},
			});

			// Thesis đã được duyệt (status = 'Approved')
			const thesisApproved = await this.prisma.thesis.count({
				where: {
					semesterId,
					status: 'Approved', // enum value must match Prisma enum (capitalized)
				},
			});

			// Tổng số supervisor đã được phân công (distinct lecturerId trong supervision của thesis thuộc semester)
			const assignedSupervisors = await this.prisma.supervision.findMany({
				where: {
					thesis: {
						semesterId,
						groupId: { not: null },
					},
				},
				select: { lecturerId: true },
				distinct: ['lecturerId'],
			});
			const totalAssignedSupervisors = assignedSupervisors.length;

			// Supervisor Load Distribution: số lượng thesis được pick mà lecturer hướng dẫn (từ bảng supervision)
			const supervisions = await this.prisma.supervision.findMany({
				where: {
					thesis: {
						semesterId,
						groupId: { not: null },
					},
				},
				include: {
					lecturer: {
						include: {
							user: true,
						},
					},
				},
			});
			// Group by lecturerId
			const supervisorMap = new Map();
			for (const s of supervisions) {
				if (!supervisorMap.has(s.lecturerId)) {
					supervisorMap.set(s.lecturerId, {
						lecturerId: s.lecturerId,
						fullName: s.lecturer.user.fullName,
						thesisCount: 1,
					});
				} else {
					supervisorMap.get(s.lecturerId).thesisCount++;
				}
			}
			const supervisorLoadDistribution = Array.from(supervisorMap.values());

			return {
				summaryCard: {
					totalStudents,
					totalLecturers,
					totalTheses,
					totalGroups,
				},
				progressOverview: {
					totalStudentGrouped,
					totalGroupPickedThesis,
					thesisApproved,
					totalAssignedSupervisors,
				},
				supervisorLoadDistribution,
			};
		} catch (error) {
			this.logger.error(
				`Error fetching dashboard data for semester ${semesterId}`,
				error.stack,
			);
			throw error;
		}
	}

	async getAIStatistics(semesterId: string) {
		this.logger.log(
			`Fetching AI statistics for semester with ID: ${semesterId}`,
		);

		try {
			// Verify semester exists
			const semester = await this.prisma.semester.findUnique({
				where: { id: semesterId },
			});

			if (!semester) {
				this.logger.warn(`Semester with ID ${semesterId} not found`);
				throw new NotFoundException(`Semester not found`);
			}

			// Get AI statistics grouped by type
			const aiStatistics = await this.prisma.statisticAI.groupBy({
				by: ['type'],
				where: {
					semesterId,
				},
				_count: {
					_all: true,
				},
			});

			// Transform the data to a more readable format
			const statistics = aiStatistics.map((stat) => ({
				type: stat.type,
				count: stat._count._all,
			}));

			// Get total count
			const totalCalls = statistics.reduce((sum, stat) => sum + stat.count, 0);

			this.logger.log(
				`Found AI statistics for semester ${semesterId}: ${totalCalls} total calls`,
			);
			this.logger.debug('AI statistics details', JSON.stringify(statistics));

			return {
				semesterId,
				totalCalls,
				statistics,
			};
		} catch (error) {
			this.logger.error('Error fetching AI statistics for semester:', error);
			throw error;
		}
	}

	async update(id: string, dto: UpdateSemesterDto): Promise<SemesterResponse> {
		this.logger.log(`Updating semester with ID: ${id}`);

		try {
			// Validation: defaultThesesPerLecturer must be less than maxThesesPerLecturer
			const existingSemester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!existingSemester) {
				this.logger.warn(`Semester with ID ${id} not found`);
				throw new NotFoundException(`Semester with ID ${id} not found`);
			}

			// Validation: defaultThesesPerLecturer must be less than maxThesesPerLecturer
			const newDefault =
				dto.defaultThesesPerLecturer ??
				existingSemester.defaultThesesPerLecturer;
			const newMax =
				dto.maxThesesPerLecturer ?? existingSemester.maxThesesPerLecturer;
			if (newDefault != null && newMax != null && newDefault > newMax) {
				this.logger.warn(
					`Default Theses Per Lecturer (${newDefault}) must be less or equal to Max Theses Per Lecturer (${newMax})`,
				);
				throw new ConflictException(
					'Default Theses Per Lecturer must be less or equal to Max Theses Per Lecturer',
				);
			}

			await this.statusService.validateSemesterUpdate(existingSemester, dto);

			const updatedDto = this.statusService.prepareUpdateData(
				existingSemester,
				dto,
			);

			const updated = await this.prisma.semester.update({
				where: { id },
				data: updatedDto,
			});

			// Nếu status mới là Ongoing, cập nhật toàn bộ enrollment sang Ongoing
			if (updated.status === 'Ongoing') {
				await this.prisma.enrollment.updateMany({
					where: { semesterId: id },
					data: { status: 'Ongoing' },
				});
				this.logger.log(`All enrollments in semester ${id} set to Ongoing`);
			}

			this.logger.log(`Semester with ID ${id} updated successfully`);
			this.logger.debug('Updated semester details', updated);

			const result: SemesterResponse = mapSemester(updated);

			// const cacheKey = `${CACHE_KEY}/${id}`;
			// await this.cache.saveToCache(cacheKey, result);
			// await this.cache.delete(`${CACHE_KEY}/`);

			return result;
		} catch (error) {
			this.logger.error(`Error updating semester with ID ${id}`, error);

			throw error;
		}
	}

	async remove(id: string): Promise<SemesterResponse> {
		this.logger.log(`Removing semester with ID: ${id}`);

		try {
			const semester = await this.prisma.semester.findUnique({
				where: { id },
			});

			if (!semester) {
				this.logger.warn(`Semester ${id} not found`);

				throw new NotFoundException(`Semester not found`);
			}

			this.statusService.ensureDeletableStatus(semester);
			await this.ensureNoDependencies(semester.id);

			const deleted = await this.prisma.semester.delete({ where: { id } });

			this.logger.log(`Deleted semester with ID: ${id}`);
			this.logger.debug('Deleted semester details', JSON.stringify(deleted));

			const result: SemesterResponse = mapSemester(deleted);

			// const cacheKey = `${CACHE_KEY}/${id}`;
			// await this.cache.delete(cacheKey);
			// await this.cache.delete(`${CACHE_KEY}/`);

			return result;
		} catch (error) {
			this.logger.error('Failed to delete semester', error);

			throw error;
		}
	}

	// ------------------------------------------------------------------------------------------
	// Additional methods for semester management can be added here
	// ------------------------------------------------------------------------------------------

	private async ensureNoDuplicate(name: string, code: string): Promise<void> {
		const conflictSemester = await this.prisma.semester.findFirst({
			where: {
				OR: [{ name: name }, { code: code }],
			},
		});

		if (conflictSemester) {
			const field = conflictSemester.name === name ? 'name' : 'code';
			this.logger.warn(`Duplicate ${field}: ${name}`);

			throw new ConflictException(`Semester with this ${field} already exists`);
		}
	}

	private async ensureNoDependencies(semesterId: string): Promise<void> {
		const counts = await this.prisma.$queryRaw<{
			groups: number;
			enrollments: number;
			milestones: number;
			studentGroupParticipations: number;
		}>`
			SELECT
				COUNT(DISTINCT g.id) AS groups,
				COUNT(DISTINCT e.student_id) AS enrollments,
				COUNT(DISTINCT m.id) AS milestones,
				COUNT(DISTINCT sgp.group_id) AS studentGroupParticipations
			FROM
				groups g
			LEFT JOIN
				_enrollments e ON e.semester_id = g.semester_id AND g.semester_id = ${semesterId}
			LEFT JOIN
				milestones m ON m.semester_id = g.semester_id AND g.semester_id = ${semesterId}
			LEFT JOIN
				_student_group_participations sgp ON sgp.semester_id = g.semester_id AND g.semester_id = ${semesterId}
			WHERE
				g.semester_id = ${semesterId}
		`;

		const { groups, enrollments, milestones, studentGroupParticipations } =
			counts[0];

		const hasRelations =
			groups > 0 ||
			enrollments > 0 ||
			milestones > 0 ||
			studentGroupParticipations > 0;

		if (hasRelations) {
			this.logger.warn(`Semester ${semesterId} has dependent relationships`);

			throw new ConflictException(
				`Cannot delete semester: it has related data.`,
			);
		}
	}
}
