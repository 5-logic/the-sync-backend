import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateStudentDto } from '@/students/dto/create-student.dto';
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
					isActive: createStudentDto.isActive,
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
						select: {
							id: true,
							fullName: true,
							email: true,
							gender: true,
							phoneNumber: true,
							isActive: true,
						},
					},
				},
			});

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
						select: {
							id: true,
							fullName: true,
							email: true,
							gender: true,
							phoneNumber: true,
							isActive: true,
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
					email: updateStudentDto.email,
					fullName: updateStudentDto.fullName,
					gender: updateStudentDto.gender,
					phoneNumber: updateStudentDto.phoneNumber,
					isActive: updateStudentDto.isActive,
				};

				const updatedUser = await UserService.update(
					id,
					updateUserDto,
					prisma as PrismaClient,
					this.logger,
				);

				const updatedStudent = await prisma.student.update({
					where: { userId: id },
					data: {
						studentId: updateStudentDto.studentId,
						majorId: updateStudentDto.majorId,
					},
				});

				return {
					...updatedUser,
					studentId: updatedStudent.studentId,
					majorId: updatedStudent.majorId,
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
						isActive: createStudentDto.isActive,
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
							studentId: createStudentDto.studentId,
							semesterId: createStudentDto.semesterId,
							status: EnrollmentStatus.NotYet,
						},
					});

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
}
