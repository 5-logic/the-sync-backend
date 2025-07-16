import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { UpdateAdminDto } from '@/admins/dto';
import { AdminResponse } from '@/admins/responses';
import { PrismaService } from '@/providers';
import { hash, verify } from '@/utils';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(private readonly prisma: PrismaService) {}

	async findOne(id: string): Promise<AdminResponse> {
		try {
			const admin = await this.prisma.admin.findUnique({
				where: { id: id },
				omit: {
					password: true,
				},
			});

			if (!admin) {
				this.logger.warn(`Admin with ID ${id} not found`);

				throw new NotFoundException(`Admin not found`);
			}

			this.logger.log(`Admin found with ID: ${admin.id}`);

			const result: AdminResponse = {
				id: admin.id,
				username: admin.username,
				email: admin.email ?? '',
				createdAt: admin.createdAt.toISOString(),
				updatedAt: admin.updatedAt.toISOString(),
			};

			return result;
		} catch (error) {
			this.logger.error('Error fetching admin', error);

			throw error;
		}
	}

	async update(id: string, dto: UpdateAdminDto): Promise<AdminResponse> {
		try {
			const existingAdmin = await this.prisma.admin.findUnique({
				where: { id },
			});

			if (!existingAdmin) {
				this.logger.warn(`Admin with ID ${id} not found`);

				throw new NotFoundException(`Admin not found`);
			}

			const updateData: { email?: string; password?: string } = {};

			// Handle email update
			if (dto.email) {
				if (dto.email === existingAdmin.email) {
					const admin = {
						id: existingAdmin.id,
						username: existingAdmin.username,
						email: existingAdmin.email ?? '',
						createdAt: existingAdmin.createdAt.toISOString(),
						updatedAt: existingAdmin.updatedAt.toISOString(),
					};
					return admin;
				}
				updateData.email = dto.email;
			}

			// Handle password change
			if (dto.newPassword || dto.oldPassword) {
				await this.validatePasswordChange(dto, existingAdmin.password, id);

				updateData.password = await hash(dto.newPassword!);
			}

			// Check if there's anything to update
			if (Object.keys(updateData).length === 0) {
				this.logger.warn('No valid fields provided for update');

				throw new BadRequestException(
					'No valid fields provided for update. Please provide at least one field to update.',
				);
			}

			const updatedAdmin = await this.prisma.admin.update({
				where: { id },
				data: updateData,
				omit: { password: true },
			});

			this.logger.log(`Admin updated with ID: ${updatedAdmin.id}`);

			const result: AdminResponse = {
				id: updatedAdmin.id,
				username: updatedAdmin.username,
				email: updatedAdmin.email ?? '',
				createdAt: updatedAdmin.createdAt.toISOString(),
				updatedAt: updatedAdmin.updatedAt.toISOString(),
			};

			return result;
		} catch (error) {
			this.logger.error('Error updating admin', error);

			throw error;
		}
	}

	private async validatePasswordChange(
		dto: UpdateAdminDto,
		currentPassword: string,
		adminId: string,
	) {
		// Both passwords must be provided
		if (!dto.oldPassword || !dto.newPassword) {
			throw new BadRequestException(
				'Both oldPassword and newPassword are required to change password',
			);
		}

		// New password must be different
		if (dto.oldPassword === dto.newPassword) {
			throw new BadRequestException(
				'New password must be different from current password',
			);
		}

		// Verify old password
		const isOldPasswordValid = await verify(currentPassword, dto.oldPassword);
		if (!isOldPasswordValid) {
			this.logger.warn(`Invalid old password for admin with ID ${adminId}`);

			throw new BadRequestException('Current password is incorrect');
		}

		this.logger.log(`Password validation passed for admin with ID: ${adminId}`);
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
