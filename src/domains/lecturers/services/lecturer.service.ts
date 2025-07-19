import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CACHE_KEY } from '@/lecturers/constants';
import { mapLecturerV1, mapLecturerV2 } from '@/lecturers/mappers';
import { LecturerResponse } from '@/lecturers/responses';
import { CacheHelperService, PrismaService } from '@/providers';
import { UpdateUserDto } from '@/users/dto';

@Injectable()
export class LecturerService {
	private readonly logger = new Logger(LecturerService.name);

	constructor(
		private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
	) {}

	async findAll(): Promise<LecturerResponse[]> {
		this.logger.log('Fetching all lecturers');

		try {
			const cacheKey = `${CACHE_KEY}/`;
			const cache = await this.cache.getFromCache<LecturerResponse[]>(cacheKey);
			if (cache) {
				this.logger.log('Returning lecturers from cache');

				return cache;
			}

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

			this.logger.log(`Found ${lecturers.length} lecturers`);
			this.logger.debug('Lecturers data', JSON.stringify(lecturers));

			const result: LecturerResponse[] = lecturers.map(mapLecturerV2);

			await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error('Error fetching lecturers', error);
			throw error;
		}
	}

	async findOne(id: string): Promise<LecturerResponse> {
		this.logger.log(`Fetching lecturer with ID: ${id}`);

		try {
			const cacheKey = `${CACHE_KEY}/${id}`;
			const cache = await this.cache.getFromCache<LecturerResponse>(cacheKey);
			if (cache) {
				this.logger.log(`Returning lecturer ${id} from cache`);

				return cache;
			}

			const lecturer = await this.prisma.lecturer.findUnique({
				where: { userId: id },
				include: {
					user: true,
				},
			});

			if (!lecturer) {
				this.logger.warn(`Lecturer with ID ${id} not found`);

				throw new NotFoundException(`Lecturer not found`);
			}

			this.logger.log(`Lecturer found with ID: ${lecturer.userId}`);
			this.logger.debug('Lecturer detail', JSON.stringify(lecturer));

			const result: LecturerResponse = mapLecturerV2(lecturer);

			await this.cache.saveToCache(cacheKey, result);

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
				});

				const result: LecturerResponse = mapLecturerV1(
					updatedUser,
					existingLecturer,
				);

				return result;
			});

			this.logger.log(`Lecturer updated with ID: ${result.id}`);
			this.logger.debug('Updated Lecturer', JSON.stringify(result));

			const cacheKey = `${CACHE_KEY}/${id}`;
			await this.cache.saveToCache(cacheKey, result);
			await this.cache.delete(`${CACHE_KEY}/`);

			return result;
		} catch (error) {
			this.logger.error(`Error updating lecturer with ID ${id}`, error);

			throw error;
		}
	}
}
