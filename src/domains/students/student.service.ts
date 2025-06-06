import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';
import { CreateStudentDto } from '@/students/dto/create-student.dto';
import { UpdateStudentDto } from '@/students/dto/update-student.dto';
import { UserService } from '@/users/user.service';
import { hash } from '@/utils/hash.util';

@Injectable()
export class StudentService {
	private readonly logger = new Logger(StudentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UserService,
	) {}

	async create(createStudentDto: CreateStudentDto): Promise<any> {
		try {
			const result = await this.prisma.$transaction(async () => {
				const newUser = await this.userService.create(
					createStudentDto.createUserDto,
				);
				const userId = newUser.id;

				const existingStudent = await this.prisma.student.findUnique({
					where: { userId },
				});
				if (existingStudent) {
					throw new ConflictException(
						`Student with userId ${userId} already exists`,
					);
				}

				const newStudent = await this.prisma.student.create({
					data: {
						userId,
						studentId: createStudentDto.studentId,
						roles: createStudentDto.roles,
						skills: createStudentDto.skills,
						academicInterests: createStudentDto.academicInterests,
						majorId: createStudentDto.majorId,
					},
					include: {
						groups: { select: { id: true } },
					},
				});

				return {
					...newStudent,
					groups: newStudent.groups?.map((g: { id: string }) => g.id) ?? [],
				};
			});

			this.logger.log(`Student created with userId: ${result.userId}`);
			return result;
		} catch (error) {
			this.logger.error('Error creating student', error);
			throw error;
		}
	}

	async findAll(): Promise<any[]> {
		try {
			const students = await this.prisma.student.findMany({
				include: {
					groups: { select: { id: true } },
				},
			});

			this.logger.log(`Found ${students.length} students`);
			return students;
		} catch (error) {
			this.logger.error('Error fetching students', error);
			throw error;
		}
	}

	async findOne(userId: string): Promise<any> {
		try {
			const student = await this.prisma.student.findUnique({
				where: { userId },
				include: {
					groups: { select: { id: true } },
				},
			});

			if (!student) {
				this.logger.warn(`Student with userId ${userId} not found`);
				throw new NotFoundException(`Student with userId ${userId} not found`);
			}

			this.logger.log(`Student found with userId: ${userId}`);
			return student;
		} catch (error) {
			this.logger.error(`Error fetching student with userId ${userId}`, error);
			throw error;
		}
	}

	async update(
		userId: string,
		updateStudentDto: UpdateStudentDto,
	): Promise<any> {
		try {
			const result = await this.prisma.$transaction(async (prisma) => {
				if (updateStudentDto.createUserDto) {
					const { password, ...userFields } = updateStudentDto.createUserDto;
					const dataToUpdate: any = { ...userFields };

					if (password) {
						dataToUpdate.password = await hash(password);
					}

					await prisma.user.update({
						where: { id: userId },
						data: dataToUpdate,
					});
				}

				const studentFields = { ...updateStudentDto };
				delete studentFields.createUserDto;

				const updatedStudent = await prisma.student.update({
					where: { userId },
					data: studentFields,
					include: {
						groups: { select: { id: true } },
					},
				});

				return updatedStudent;
			});

			this.logger.log(`Student updated with userId: ${userId}`);
			this.logger.debug('Updated Student', result);

			return result;
		} catch (error) {
			this.logger.error(`Error updating student with userId ${userId}`, error);
			throw error;
		}
	}

	async remove(userId: string): Promise<any> {
		try {
			const deletedStudent = await this.prisma.student.delete({
				where: { userId },
			});

			await this.prisma.user.delete({ where: { id: userId } });

			this.logger.log(
				`Student and user deleted with userId: ${deletedStudent.userId}`,
			);
			this.logger.debug('Deleted Student', deletedStudent);

			return {
				status: 'success',
				message: `Student and user with userId ${deletedStudent.userId} deleted successfully`,
			};
		} catch (error) {
			if (error.code === 'P2025') {
				this.logger.warn(`Student with userId ${userId} not found`);
				throw new NotFoundException(`Student with userId ${userId} not found`);
			}
			this.logger.error(`Error deleting student with userId ${userId}`, error);
			throw error;
		}
	}
}
