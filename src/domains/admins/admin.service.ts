import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { UpdateAdminDto } from '@/admins/dto/update-admin.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { hash, verify } from '@/utils/hash.util';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findOne(id: string) {
		try {
			const admin = await this.prisma.admin.findUnique({
				where: { id: id },
			});

			if (!admin) {
				this.logger.warn(`Admin with ID ${id} not found`);

				return null;
			}

			this.logger.log(`Admin found with ID: ${admin.id}`);

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password: _, ...result } = admin;

			return result;
		} catch (error) {
			this.logger.error('Error fetching admin', error);

			throw error;
		}
	}

	async update(id: string, updateAdminDto: UpdateAdminDto) {
		try {
			const existingAdmin = await this.prisma.admin.findUnique({
				where: { id: id },
			});

			if (!existingAdmin) {
				this.logger.warn(`Admin with ID ${id} not found`);

				throw new NotFoundException(`Admin with ID ${id} not found`);
			}

			const { password: newPassword, ...dataToUpdate } = updateAdminDto;

			const updatedAdmin = await this.prisma.admin.update({
				where: { id: id },
				data: {
					...dataToUpdate,
					password: newPassword
						? await hash(newPassword)
						: existingAdmin.password,
				},
			});

			this.logger.log(`Admin updated with ID: ${updatedAdmin.id}`);
			this.logger.debug(`Updated Admin`, updatedAdmin);

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password: _, ...result } = updatedAdmin;

			return result;
		} catch (error) {
			this.logger.error('Error updating admin', error);

			throw error;
		}
	}

	async validateAdmin(username: string, password: string) {
		try {
			this.logger.log(`Validating admin with username: ${username}`);

			const admin = await this.prisma.admin.findUnique({
				where: { username: username },
			});

			if (!admin) {
				this.logger.warn(`Admin with username ${username} not found`);

				return null;
			}

			const isPasswordValid = await verify(admin.password, password);

			if (!isPasswordValid) {
				this.logger.warn(
					`Invalid password for admin with username ${username}`,
				);

				return null;
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password: _, ...result } = admin;

			return result;
		} catch (error) {
			this.logger.error('Error validating admin', error);

			throw error;
		}
	}
}
