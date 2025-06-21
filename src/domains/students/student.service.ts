import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateStudentDto } from '@/students/dto/create-student.dto';
import { ToggleStudentStatusDto } from '@/students/dto/toggle-student-status.dto';
import { UpdateStudentDto } from '@/students/dto/update-student.dto';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UserService } from '@/users/user.service';

import { EnrollmentStatus, PrismaClient } from '~/generated/prisma';

@Injectable()
export class StudentService {
	private readonly logger = new Logger(StudentService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createStudentDto: CreateStudentDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const major = await prisma.major.findUnique({
					where: { id: createStudentDto.majorId },
				});

				if (!major) {
					throw new NotFoundException(
						`Major with id ${createStudentDto.majorId} not found`,
					);
				}

				const semester = await prisma.semester.findUnique({
					where: { id: createStudentDto.semesterId },
				});

				if (!semester) {
					throw new NotFoundException(
						`Semester with id ${createStudentDto.semesterId} not found`,
					);
				}

				const createUserDto: CreateUserDto = {
					email: createStudentDto.email,
					fullName: createStudentDto.fullName,
					password: createStudentDto.password,
					gender: createStudentDto.gender,
					phoneNumber: createStudentDto.phoneNumber,
				};

				// TODO: To send email to student with their credentials
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { plainPassword, ...newUser } = await UserService.create(
					createUserDto,
					prisma as PrismaClient,
					this.logger,
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

				const student = await prisma.student.create({
					data: {
						userId,
						studentId: createStudentDto.studentId,
						majorId: createStudentDto.majorId,
					},
				});

				await prisma.enrollment.create({
					data: {
						studentId: student.userId,
						semesterId: createStudentDto.semesterId,
						status: EnrollmentStatus.NotYet,
					},
				});

				this.logger.log(
					`Student created with studentId: ${createStudentDto.studentId}`,
				);

				this.logger.log(
					`Student ${createStudentDto.studentId} enrolled to semester ${createStudentDto.semesterId}`,
				);

				return {
					...newUser,
					studentId: student.studentId,
					majorId: student.majorId,
				};
			});

			this.logger.log(`Student created with userId: ${result.id}`);
			this.logger.debug('Student detail', result);

			return result;
		} catch (error) {
			this.logger.error('Error creating student', error);

			throw error;
		}
	}

	async findAll() {
		try {
			this.logger.log('Fetching all students');

			const students = await this.prisma.student.findMany({
				include: {
					user: {
						omit: {
							password: true,
						},
					},
				},
				orderBy: {
					user: {
						createdAt: 'desc',
					},
				},
			});

			// Reuse the same data transformation logic from findOne
			const formattedStudents = students.map((student) => ({
				...student.user,
				studentId: student.studentId,
				majorId: student.majorId,
			}));

			this.logger.log(`Found ${formattedStudents.length} students`);
			this.logger.debug('Students detail', formattedStudents);

			return formattedStudents;
		} catch (error) {
			this.logger.error('Error fetching students', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			this.logger.log(`Fetching student with userId: ${id}`);

			const student = await this.prisma.student.findUnique({
				where: { userId: id },
				include: {
					user: {
						omit: {
							password: true,
						},
					},
				},
			});

			if (!student) {
				this.logger.warn(`Student with userId ${id} not found`);

				throw new NotFoundException(`Student with userId ${id} not found`);
			}

			this.logger.log(`Student found with userId: ${id}`);
			this.logger.debug('Student detail', student);

			return {
				...student.user,
				studentId: student.studentId,
				majorId: student.majorId,
			};
		} catch (error) {
			this.logger.error(`Error fetching student with userId ${id}`, error);
			throw error;
		}
	}

	async update(id: string, updateStudentDto: UpdateStudentDto) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const existingStudent = await prisma.student.findUnique({
					where: { userId: id },
				});

				if (!existingStudent) {
					this.logger.warn(`Student with userId ${id} not found for update`);

					throw new NotFoundException(`Student with userId ${id} not found`);
				}

				const updateUserDto: UpdateUserDto = {
					fullName: updateStudentDto.fullName,
					gender: updateStudentDto.gender,
					phoneNumber: updateStudentDto.phoneNumber,
				};

				const updatedUser = await UserService.update(
					id,
					updateUserDto,
					prisma as PrismaClient,
					this.logger,
				);

				const updatedStudent = await prisma.student.findUnique({
					where: { userId: id },
				});

				return {
					...updatedUser,
					studentId: updatedStudent!.studentId,
					majorId: updatedStudent!.majorId,
				};
			});

			this.logger.log(`Student updated with userId: ${result.id}`);
			this.logger.debug('Updated Student', result);

			return result;
		} catch (error) {
			this.logger.error(`Error updating student with userId ${id}`, error);

			throw error;
		}
	}

	async createMany(createStudentDtos: CreateStudentDto[]) {
		try {
			const results = await this.prisma.$transaction(async (prisma) => {
				const createdStudents: any[] = [];

				for (const createStudentDto of createStudentDtos) {
					// Validate major exists
					const major = await prisma.major.findUnique({
						where: { id: createStudentDto.majorId },
					});

					if (!major) {
						throw new NotFoundException(
							`Major with id ${createStudentDto.majorId} not found`,
						);
					}

					const semester = await prisma.semester.findUnique({
						where: { id: createStudentDto.semesterId },
					});

					if (!semester) {
						throw new NotFoundException(
							`Semester with id ${createStudentDto.semesterId} not found`,
						);
					}

					// Create user DTO
					const createUserDto: CreateUserDto = {
						email: createStudentDto.email,
						fullName: createStudentDto.fullName,
						password: createStudentDto.password,
						gender: createStudentDto.gender,
						phoneNumber: createStudentDto.phoneNumber,
					};

					// Create user
					// TODO: To send email to student with their credentials
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { plainPassword, ...newUser } = await UserService.create(
						createUserDto,
						prisma as PrismaClient,
						this.logger,
					);
					const userId = newUser.id;

					// Check if student ID already exists
					const existingStudentId = await prisma.student.findUnique({
						where: { studentId: createStudentDto.studentId },
					});

					if (existingStudentId) {
						throw new ConflictException(
							`Student with studentId ${createStudentDto.studentId} already exists`,
						);
					}

					// Create student
					const student = await prisma.student.create({
						data: {
							userId,
							studentId: createStudentDto.studentId,
							majorId: createStudentDto.majorId,
						},
					});

					await prisma.enrollment.create({
						data: {
							studentId: student.userId,
							semesterId: createStudentDto.semesterId,
							status: EnrollmentStatus.NotYet,
						},
					});

					this.logger.log(
						`Student ${createStudentDto.studentId} created successfully`,
					);

					this.logger.log(
						`Student ${createStudentDto.studentId} enrolled to semester ${createStudentDto.semesterId}`,
					);

					const result = {
						...newUser,
						studentId: student.studentId,
						majorId: student.majorId,
					};

					createdStudents.push(result);

					this.logger.log(`Student created with userId: ${result.id}`);
					this.logger.debug('Student detail', result);
				}

				return createdStudents;
			});

			this.logger.log(`Successfully created ${results.length} students`);

			return results;
		} catch (error) {
			this.logger.error('Error creating students in batch', error);

			throw error;
		}
	}

	async toggleStatus(id: string, toggleDto: ToggleStudentStatusDto) {
		try {
			const { isActive } = toggleDto;

			const result = await this.prisma.$transaction(async (prisma) => {
				const existingStudent = await prisma.student.findUnique({
					where: { userId: id },
					include: {
						user: true,
					},
				});

				if (!existingStudent) {
					this.logger.warn(
						`Student with userId ${id} not found for status toggle`,
					);

					throw new NotFoundException(`Student with userId ${id} not found`);
				}

				const updatedUser = await prisma.user.update({
					where: { id },
					data: { isActive },
					omit: {
						password: true,
					},
				});

				return {
					...updatedUser,
					studentId: existingStudent.studentId,
					majorId: existingStudent.majorId,
				};
			});

			this.logger.log(
				`Student status updated - userId: ${id}, isActive: ${isActive}`,
			);

			this.logger.debug('Updated student status', result);

			return result;
		} catch (error) {
			this.logger.error(
				`Error toggling student status with userId ${id}`,
				error,
			);

			throw error;
		}
	}

	async remove(id: string) {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				const existingStudent = await prisma.student.findUnique({
					where: { userId: id },
					include: {
						user: {
							omit: {
								password: true,
							},
						},
						enrollments: true,
						studentGroupParticipations: true,
					},
				});

				if (!existingStudent) {
					this.logger.warn(`Student with ID ${id} not found for deletion`);

					throw new NotFoundException(`Student with ID ${id} not found`);
				}

				const hasRelationships =
					existingStudent.enrollments.length > 1 ||
					existingStudent.studentGroupParticipations.length > 0;

				if (hasRelationships) {
					const errorMessage = `Cannot delete student. Student with ID ${id} has existing relationships`;
					this.logger.warn(errorMessage);

					throw new ConflictException(errorMessage);
				}

				const deletedStudent = await prisma.student.delete({
					where: { userId: id },
				});

				const deletedUser = await prisma.user.delete({
					where: { id },
					omit: {
						password: true,
					},
				});

				const deletedData = {
					...deletedUser,
					studentId: deletedStudent.studentId,
					majorId: deletedStudent.majorId,
				};

				this.logger.log(`Student and associated user deleted with ID: ${id}`);
				this.logger.debug('Deleted student data', deletedData);

				return deletedData;
			});

			return result;
		} catch (error) {
			this.logger.error(`Error deleting student with userId ${id}`, error);

			throw error;
		}
	}
}
