import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { UpdateAdminDto } from '@/admins/dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { verify } from '@/utils/hash.util';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findOne(id: string) {
		try {
			const admin = await this.prisma.admin.findUnique({
				where: { id: id },
				omit: {
					password: true,
				},
			});

			if (!admin) {
				this.logger.warn(`Admin with ID ${id} not found`);

				throw new NotFoundException(`Admin with ID ${id} not found`);
			}

			this.logger.log(`Admin found with ID: ${admin.id}`);

			return admin;
		} catch (error) {
			this.logger.error('Error fetching admin', error);

			throw error;
		}
	}

	async update(id: string, dto: UpdateAdminDto) {
		try {
			const existingAdmin = await this.prisma.admin.findUnique({
				where: { id: id },
			});

			if (!existingAdmin) {
				this.logger.warn(`Admin with ID ${id} not found`);

				throw new NotFoundException(`Admin with ID ${id} not found`);
			}

			const updatedAdmin = await this.prisma.admin.update({
				where: { id: id },
				data: {
					email: dto.email,
				},
				omit: {
					password: true,
				},
			});

			this.logger.log(`Admin updated with ID: ${updatedAdmin.id}`);
			this.logger.debug(`Updated Admin`, updatedAdmin);

			return updatedAdmin;
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

			const { password: adminPassword, ...result } = admin;

			const isPasswordValid = await verify(adminPassword, password);

			if (!isPasswordValid) {
				this.logger.warn(
					`Invalid password for admin with username ${username}`,
				);

				return null;
			}

			return result;
		} catch (error) {
			this.logger.error('Error validating admin', error);

			throw error;
		}
	}
}
