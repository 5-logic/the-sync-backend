import { Injectable, Logger } from '@nestjs/common';

import { Role } from '@/auth/enums/role.enum';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { verify } from '@/utils/hash.util';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(private readonly prisma: PrismaService) {}

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
