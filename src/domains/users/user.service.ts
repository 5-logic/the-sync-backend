import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { Role } from '@/auth/enums/role.enum';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { hash, verify } from '@/utils/hash.util';
import { generateStrongPassword } from '@/utils/password-generator.util';

import { EnrollmentStatus, PrismaClient } from '~/generated/prisma';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(private readonly prisma: PrismaService) {}

	static async create(
		dto: CreateUserDto,
		prismaClient: PrismaClient,
		logger: Logger,
	) {
		try {
			const existingUser = await prismaClient.user.findFirst({
				where: {
					email: dto.email,
				},
			});

			if (existingUser) {
				logger.warn(`User with email ${dto.email}  already exists`);

				throw new ConflictException('User with this email already exists');
			}

			const password = generateStrongPassword();

			const hashedPassword = await hash(password);

			const newUser = await prismaClient.user.create({
				data: {
					...dto,
					password: hashedPassword,
				},
				omit: {
					password: true,
				},
			});

			logger.log(`User created with ID: ${newUser.id}`);
			logger.debug('User detail', newUser);

			return {
				...newUser,
				plainPassword: password,
			};
		} catch (error) {
			logger.error('Error creating user', error);

			throw error;
		}
	}

	/**
	 * Enroll an existing student in a semester and reset their password.
	 * This method handles both password reset and enrollment creation.
	 *
	 * @param userId - The user ID of the existing student
	 * @param semesterId - The semester ID to enroll the student in
	 * @param prismaClient - Prisma client instance for database operations
	 * @param logger - Logger instance for logging
	 * @returns Object containing updated user and plain password
	 */
	static async enrollExistingStudent(
		userId: string,
		semesterId: string,
		prismaClient: PrismaClient,
		logger: Logger,
	) {
		try {
			// Generate new password if not provided
			const password = generateStrongPassword();
			const hashedPassword = await hash(password);

			// Update user password
			const updatedUser = await prismaClient.user.update({
				where: { id: userId },
				data: { password: hashedPassword },
				omit: {
					password: true,
				},
			});

			// Create enrollment
			await prismaClient.enrollment.create({
				data: {
					studentId: userId,
					semesterId: semesterId,
					status: EnrollmentStatus.NotYet,
				},
			});

			logger.log(
				`Student enrolled to semester ${semesterId} with new password`,
			);

			return {
				user: updatedUser,
				plainPassword: password,
			};
		} catch (error) {
			logger.error('Error enrolling existing student', error);

			throw error;
		}
	}

	async findOne(params: { id?: string; email?: string }) {
		try {
			this.logger.log(`Fetching user with params: ${JSON.stringify(params)}`);

			const user = await this.prisma.user.findFirst({
				where: {
					OR: [{ id: params.id }, { email: params.email }],
				},
				omit: {
					password: true,
				},
			});

			if (!user) {
				this.logger.warn(`User not found with provided parameters`);

				return null;
			}

			return user;
		} catch (error) {
			this.logger.error('Error fetching user', error);

			throw error;
		}
	}

	static async update(
		id: string,
		dto: UpdateUserDto,
		prismaClient: PrismaClient,
		logger: Logger,
	) {
		try {
			const existingUser = await prismaClient.user.findUnique({
				where: { id },
			});

			if (!existingUser) {
				logger.warn(`User with ID ${id} not found for update`);

				throw new NotFoundException(`User with ID ${id} not found`);
			}

			const updatedUser = await prismaClient.user.update({
				where: { id },
				data: dto,
				omit: {
					password: true,
				},
			});

			logger.log(`User updated with ID: ${updatedUser.id}`);
			logger.debug('Updated User', updatedUser);

			return updatedUser;
		} catch (error) {
			logger.error('Error updating user', error);

			throw error;
		}
	}

	async validateUser(email: string, password: string) {
		try {
			this.logger.log(`Validating user with email: ${email}`);

			const user = await this.prisma.user.findUnique({
				where: { email: email, isActive: true },
			});

			if (!user) {
				this.logger.warn(`User with email ${email} not found`);

				return null;
			}

			const isPasswordValid = await verify(user.password, password);

			if (!isPasswordValid) {
				this.logger.warn(`Invalid password for user with email ${email}`);

				return null;
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password: _, ...result } = user;

			return result;
		} catch (error) {
			this.logger.error('Error validating user', error);

			throw error;
		}
	}

	async checkRole(id: string): Promise<Role | null> {
		try {
			this.logger.log(`Checking role for user with ID: ${id}`);

			const user = await this.prisma.user.findUnique({
				where: { id: id },
				include: {
					student: true,
					lecturer: true,
				},
			});

			if (!user) {
				this.logger.warn(`User with ID ${id} not found`);

				return null;
			}

			if (user.lecturer) {
				const role = user.lecturer.isModerator ? Role.MODERATOR : Role.LECTURER;
				this.logger.log(`User with ID ${id} is a ${role}`);

				return role;
			}

			if (user.student) {
				this.logger.log(`User with ID ${id} is a ${Role.STUDENT}`);
				return Role.STUDENT;
			}

			return null;
		} catch (error) {
			this.logger.error('Error checking user role', error);

			throw error;
		}
	}
}
