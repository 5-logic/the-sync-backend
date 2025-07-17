import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CACHE_KEY } from '@/admins/constants';
import { UpdateAdminDto } from '@/admins/dto';
import { mapAdmin } from '@/admins/mappers';
import { AdminResponse } from '@/admins/responses';
import { CacheHelperService, PrismaService } from '@/providers';
import { hash, verify } from '@/utils';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(
		private readonly cache: CacheHelperService,
		private readonly prisma: PrismaService,
	) {}

	async findOne(id: string): Promise<AdminResponse> {
		this.logger.log(`Fetching admin with ID: ${id}`);

		try {
			const cacheKey = `${CACHE_KEY}/${id}`;
			const cache = await this.cache.getFromCache<AdminResponse>(cacheKey);
			if (cache) {
				this.logger.log(`Returning cached admin with ID: ${id}`);

				return cache;
			}

			const admin = await this.prisma.admin.findUnique({
				where: { id: id },
			});

			if (!admin) {
				this.logger.warn(`Admin with ID ${id} not found`);

				throw new NotFoundException(`Admin not found`);
			}

			this.logger.log(`Admin found with ID: ${admin.id}`);
			this.logger.debug('Admin details:', JSON.stringify(admin));

			const result: AdminResponse = mapAdmin(admin);

			await this.cache.saveToCache(cacheKey, result);

			return result;
		} catch (error) {
			this.logger.error('Error fetching admin', error);

			throw error;
		}
	}

	async update(id: string, dto: UpdateAdminDto): Promise<AdminResponse> {
		this.logger.log(`Updating admin with ID: ${id}`);

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
					const admin = mapAdmin(existingAdmin);

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
			});

			this.logger.log(`Admin updated with ID: ${updatedAdmin.id}`);
			this.logger.debug('Updated admin details:', JSON.stringify(updatedAdmin));

			const result: AdminResponse = mapAdmin(updatedAdmin);

			// Clear cache for this admin after update
			const cacheKey = `${CACHE_KEY}/${id}`;
			await this.cache.delete(cacheKey);
			this.logger.log(`Cache cleared for admin with ID: ${id}`);

			// Save updated admin to cache
			await this.cache.saveToCache(cacheKey, result);

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
