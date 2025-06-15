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

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(private readonly prisma: PrismaService) {}

	static async create(
		createUserDto: CreateUserDto,
		prismaService: PrismaService,
		logger: Logger,
	) {
		try {
			const existingUser = await prismaService.user.findFirst({
				where: {
					email: createUserDto.email,
				},
			});

			if (existingUser) {
				logger.warn(`User with email ${createUserDto.email}  already exists`);

				throw new ConflictException('User with this email already exists');
			}

			const password = createUserDto.password || generateStrongPassword();

			const hashedPassword = await hash(password);

			const newUser = await prismaService.user.create({
				data: {
					...createUserDto,
					password: hashedPassword,
				},
			});

			logger.log(`User created with ID: ${newUser.id}`);
			logger.debug('User detail', newUser);

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password: _, ...result } = newUser;

			return result;
		} catch (error) {
			logger.error('Error creating user', error);

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
			});

			if (!user) {
				this.logger.warn(`User not found with provided parameters`);

				return null;
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password: _, ...result } = user;

			return result;
		} catch (error) {
			this.logger.error('Error fetching user', error);

			throw error;
		}
	}

	async update(id: string, updateUserDto: UpdateUserDto) {
		try {
			const existingUser = await this.prisma.user.findUnique({
				where: { id },
			});

			if (!existingUser) {
				this.logger.warn(`User with ID ${id} not found for update`);

				throw new NotFoundException(`User with ID ${id} not found`);
			}

			const { password: newPassword, ...dataToUpdate } = updateUserDto;

			const updatedUser = await this.prisma.user.update({
				where: { id },
				data: {
					...dataToUpdate,
					password: newPassword
						? await hash(newPassword)
						: existingUser.password,
				},
			});

			this.logger.log(`User updated with ID: ${updatedUser.id}`);
			this.logger.debug('Updated User', updatedUser);

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password: _, ...result } = updatedUser;

			return result;
		} catch (error) {
			this.logger.error('Error updating user', error);

			throw error;
		}
	}

	async validateUser(email: string, password: string) {
		try {
			this.logger.log(`Validating user with email: ${email}`);

			const user = await this.prisma.user.findUnique({
				where: { email: email },
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
