import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateStudentDto } from '@/students/dto/create-student.dto';
import { UpdateStudentDto } from '@/students/dto/update-student.dto';
import { UserService } from '@/users/user.service';

@Injectable()
export class StudentService {
	private readonly logger = new Logger(StudentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UserService,
	) {}

	async create(createStudentDto: CreateStudentDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const newUser = await this.userService.create(
					createStudentDto.createUserDto,
					prisma,
				);
				const userId = newUser.id;

				const existingStudentId = await prisma.student.findUnique({
					where: { studentId: createStudentDto.studentId },
				});
				if (existingStudentId) {
					throw new ConflictException(
						`Student with studentId ${createStudentDto.studentId} already exists`,
					);
				}

				const major = await prisma.major.findUnique({
					where: { id: createStudentDto.majorId },
				});
				if (!major) {
					throw new NotFoundException(
						`Major with id ${createStudentDto.majorId} not found`,
					);
				}

				const student = await prisma.student.create({
					data: {
						userId,
						studentId: createStudentDto.studentId,
						majorId: createStudentDto.majorId,
					},
				});

				if (createStudentDto.semesterId) {
					const semester = await prisma.semester.findUnique({
						where: { id: createStudentDto.semesterId },
					});
					if (!semester) {
						throw new NotFoundException(
							`Semester with id ${createStudentDto.semesterId} not found`,
						);
					}

					await prisma.enrollment.create({
						data: {
							studentId: createStudentDto.studentId,
							semesterId: createStudentDto.semesterId,
							status: 'Ongoing',
						},
					});
					this.logger.log(
						`Student ${createStudentDto.studentId} enrolled to semester ${createStudentDto.semesterId}`,
					);
				}

				return student;
			});

			this.logger.log(`Student created with userId: ${result.userId}`);
			this.logger.debug('Student detail', result);

			return result;
		} catch (error) {
			this.logger.error('Error creating student', error);
			throw error;
		}
	}

	async findAll() {
		try {
			const students = await this.prisma.student.findMany();

			this.logger.log(`Found ${students.length} students`);
			this.logger.debug('Students detail', students);

			return students;
		} catch (error) {
			this.logger.error('Error fetching students', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			this.logger.log(`Fetching student with userId: ${id}`);

			const student = await this.prisma.student.findFirst({
				where: { userId: id },
			});

			if (!student) {
				this.logger.warn(`Student with userId ${id} not found`);
				throw new NotFoundException(`Student with userId ${id} not found`);
			}

			this.logger.log(`Student found with userId: ${id}`);
			this.logger.debug('Student detail', student);

			return student;
		} catch (error) {
			this.logger.error(`Error fetching student with userId ${id}`, error);
			throw error;
		}
	}

	async update(id: string, updateStudentDto: UpdateStudentDto) {
		try {
			const existingStudent = await this.prisma.student.findUnique({
				where: { userId: id },
			});

			if (!existingStudent) {
				this.logger.warn(`Student with userId ${id} not found for update`);
				throw new NotFoundException(`Student with userId ${id} not found`);
			}

			const updatedStudent = await this.prisma.student.update({
				where: { userId: id },
				data: {
					studentId: updateStudentDto.studentId,
					majorId: updateStudentDto.majorId,
				},
			});

			this.logger.log(`Student updated with userId: ${updatedStudent.userId}`);
			this.logger.debug('Updated Student', updatedStudent);

			return updatedStudent;
		} catch (error) {
			this.logger.error(`Error updating student with userId ${id}`, error);
			throw error;
		}
	}

	async remove(id: string) {
		try {
			const deleted = await this.prisma.student.delete({
				where: { userId: id },
			});

			await this.prisma.user.delete({ where: { id } });

			this.logger.log(`Student and user deleted with userId: ${id}`);
			this.logger.debug('Deleted Student', deleted);

			return {
				status: 'success',
				message: `Student and user with userId ${id} deleted successfully`,
			};
		} catch (error) {
			this.logger.error(`Error deleting student with userId ${id}`, error);
			throw error;
		}
	}

	async createMany(createStudentDtos: CreateStudentDto[]) {
		const results: any[] = [];
		for (const dto of createStudentDtos) {
			try {
				const result = await this.prisma.$transaction(async (prisma) => {
					const newUser = await this.userService.create(
						dto.createUserDto,
						prisma,
					);
					const userId = newUser.id;

					const existingStudent = await prisma.student.findUnique({
						where: { userId },
					});

					if (existingStudent) {
						throw new ConflictException(
							`Student with userId ${userId} already exists`,
						);
					}

					const student = await prisma.student.create({
						data: {
							userId,
							studentId: dto.studentId,
							majorId: dto.majorId,
						},
					});

					if (dto.semesterId) {
						await prisma.enrollment.create({
							data: {
								studentId: dto.studentId,
								semesterId: dto.semesterId,
								status: 'Ongoing',
							},
						});
					}

					return { student };
				});

				this.logger.log(
					`Student created with userId: ${result.student.userId}`,
				);
				this.logger.debug('Student detail', result.student);

				results.push({ success: true, student: result.student });
			} catch (error) {
				this.logger.error('Error creating student', error);
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
