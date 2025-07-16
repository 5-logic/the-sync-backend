import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { ChangePasswordDto, Role } from '@/auth';
import { PrismaService } from '@/providers';
import { hash, verify } from '@/utils';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findOne(params: { id?: string; email?: string }) {
		this.logger.log(`Fetching user with params: ${JSON.stringify(params)}`);

		try {
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

				throw new NotFoundException('User not found');
			}

			return user;
		} catch (error) {
			this.logger.error('Error fetching user', error);

			throw error;
		}
	}

	async validateUser(email: string, password: string) {
		this.logger.log(`Validating user with email: ${email}`);

		try {
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
		this.logger.log(`Checking role for user with ID: ${id}`);

		try {
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

	async changePassword(userId: string, dto: ChangePasswordDto) {
		this.logger.log(`Changing password for user: ${userId}`);

		try {
			const existingUser = await this.prisma.user.findUnique({
				where: { id: userId },
				select: { id: true, password: true },
			});

			if (!existingUser) {
				this.logger.warn(`User with ID ${userId} not found`);

				throw new NotFoundException('User not found');
			}

			if (dto.currentPassword === dto.newPassword) {
				this.logger.warn(
					`New password must be different from current password for user: ${userId}`,
				);

				throw new ConflictException(
					'New password must be different from current password',
				);
			}

			const isCurrentPasswordValid = await verify(
				existingUser.password,
				dto.currentPassword,
			);

			if (!isCurrentPasswordValid) {
				this.logger.warn(`Invalid current password for user: ${userId}`);

				throw new ConflictException('Current password is incorrect');
			}

			const hashedNewPassword = await hash(dto.newPassword);

			await this.prisma.user.update({
				where: { id: userId },
				data: { password: hashedNewPassword },
			});

			this.logger.log(`Password changed successfully for user: ${userId}`);

			return;
		} catch (error) {
			if (
				error instanceof ConflictException ||
				error instanceof NotFoundException
			) {
				throw error;
			}

			this.logger.error(`Error changing password for user ${userId}:`, error);

			throw new BadRequestException('Failed to change password');
		}
	}

	async updatePassword(id: string, newPassword: string): Promise<void> {
		this.logger.log(`Updating password for user: ${id}`);

		try {
			const hashedPassword = await hash(newPassword);

			await this.prisma.user.update({
				where: { id: id },
				data: { password: hashedPassword },
			});

			this.logger.log(`Password updated successfully for user: ${id}`);
		} catch (error) {
			this.logger.error('Error updating user password', error);

			throw error;
		}
	}
}
