import { ConflictException, Injectable, Logger } from '@nestjs/common';

import { CreateAdminDto } from '@/admins/dto/create-admin.dto';
import { UpdateAdminDto } from '@/admins/dto/update-admin.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { hash } from '@/utils/hash.util';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(createAdminDto: CreateAdminDto) {
		try {
			const admin = await this.prisma.admin.findUnique({
				where: { username: createAdminDto.username },
			});

			if (admin) {
				this.logger.warn(
					`Admin with username ${createAdminDto.username} already exists`,
				);
				throw new ConflictException('Admin with this username already exists');
			}

			const hashedPassword = await hash(createAdminDto.password);
			const newAdmin = await this.prisma.admin.create({
				data: {
					username: createAdminDto.username,
					email: createAdminDto.email,
					password: hashedPassword,
				},
			});

			this.logger.log(`Admin created with ID: ${newAdmin.id}`);
			this.logger.debug(`Admin`, newAdmin);

			return {
				id: newAdmin.id,
				username: newAdmin.username,
				email: newAdmin.email,
			};
		} catch (error) {
			this.logger.error('Error creating admin', error);
			throw error;
		}
	}

	async findAll() {
		try {
			const admins = await this.prisma.admin.findMany();

			this.logger.log(`Found ${admins.length} admins`);

			return admins;
		} catch (error) {
			this.logger.error('Error fetching admins', error);
			throw error;
		}
	}

	async findOne(id: string) {
		try {
			const admin = await this.prisma.admin.findUnique({
				where: { id },
			});

			if (!admin) {
				this.logger.warn(`Admin with ID ${id} not found`);
				return null;
			}

			this.logger.log(`Admin found with ID: ${admin.id}`);
			return admin;
		} catch (error) {
			this.logger.error('Error fetching admin', error);
			throw error;
		}
	}

	async update(id: string, updateAdminDto: UpdateAdminDto) {
		try {
			const updatedAdmin = await this.prisma.admin.update({
				where: { id },
				data: updateAdminDto,
			});

			this.logger.log(`Admin updated with ID: ${updatedAdmin.id}`);
			return updatedAdmin;
		} catch (error) {
			this.logger.error('Error updating admin', error);
			throw error;
		}
	}

	async remove(id: string) {
		try {
			const deletedAdmin = await this.prisma.admin.delete({
				where: { id },
			});

			this.logger.log(`Admin deleted with ID: ${deletedAdmin.id}`);
			return {
				status: 'success',
				message: `Admin with ID ${deletedAdmin.id} deleted successfully`,
			};
		} catch (error) {
			this.logger.error('Error deleting admin', error);
			throw error;
		}
	}
}
