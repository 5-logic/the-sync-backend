import { Test, TestingModule } from '@nestjs/testing';

import { AdminService } from '@/admins/admin.service';
import { CreateAdminDto } from '@/admins/dto/create-admin.dto';
import { UpdateAdminDto } from '@/admins/dto/update-admin.dto';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { hash as hashUtil } from '@/utils/hash.util';

jest.mock('@/utils/hash.util', () => ({
	hash: jest.fn((pw) => `hashed-${pw}`),
}));

const mockPrisma = {
	admin: {
		create: jest.fn(),
		findMany: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
};

describe('AdminService', () => {
	let service: AdminService;
	const adminId = 'admin-1';

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AdminService,
				{ provide: PrismaService, useValue: mockPrisma },
			],
		}).compile();

		service = module.get<AdminService>(AdminService);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create and return a new admin', async () => {
			const dto: CreateAdminDto = {
				username: 'admin',
				email: 'a@a.com',
				password: 'pass',
			};
			mockPrisma.admin.findUnique.mockResolvedValue(null);
			const created = { id: adminId, username: dto.username, email: dto.email };
			mockPrisma.admin.create.mockResolvedValue(created);

			const result = await service.create(dto);
			expect(result).toEqual({
				id: created.id,
				username: created.username,
				email: created.email,
			});
			expect(mockPrisma.admin.findUnique).toHaveBeenCalledWith({
				where: { username: dto.username },
			});
			expect(hashUtil).toHaveBeenCalledWith(dto.password);
			expect(mockPrisma.admin.create).toHaveBeenCalledWith({
				data: {
					username: dto.username,
					email: dto.email,
					password: 'hashed-pass',
				},
			});
		});

		it('should throw if username already exists', async () => {
			const dto: CreateAdminDto = {
				username: 'admin',
				email: 'a@a.com',
				password: 'pass',
			};
			mockPrisma.admin.findUnique.mockResolvedValue({ id: adminId });

			await expect(service.create(dto)).rejects.toThrow(
				'Admin with this username already exists',
			);
			expect(mockPrisma.admin.create).not.toHaveBeenCalled();
		});

		it('should throw on error', async () => {
			const dto: CreateAdminDto = {
				username: 'admin',
				email: 'a@a.com',
				password: 'pass',
			};
			mockPrisma.admin.findUnique.mockRejectedValue(new Error('fail'));
			await expect(service.create(dto)).rejects.toThrow('fail');
		});
	});

	describe('findAll', () => {
		it('should return all admins', async () => {
			const admins = [{ id: adminId }, { id: 'admin-2' }];
			mockPrisma.admin.findMany.mockResolvedValue(admins);

			const result = await service.findAll();
			expect(result).toEqual(admins);
			expect(mockPrisma.admin.findMany).toHaveBeenCalled();
		});

		it('should throw on error', async () => {
			mockPrisma.admin.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.findAll()).rejects.toThrow('fail');
		});
	});

	describe('findOne', () => {
		it('should return an admin by id', async () => {
			const admin = {
				id: adminId,
				username: 'admin',
				email: 'a@a.com',
				password: 'pass',
			};
			mockPrisma.admin.findUnique.mockResolvedValue(admin);

			const result = await service.findOne(adminId);
			expect(result).toEqual(admin);
			expect(mockPrisma.admin.findUnique).toHaveBeenCalledWith({
				where: { id: adminId },
			});
		});

		it('should return null if not found', async () => {
			mockPrisma.admin.findUnique.mockResolvedValue(null);
			const result = await service.findOne('notfound');
			expect(result).toBeNull();
		});

		it('should throw on error', async () => {
			mockPrisma.admin.findUnique.mockRejectedValue(new Error('fail'));
			await expect(service.findOne(adminId)).rejects.toThrow('fail');
		});
	});

	describe('update', () => {
		it('should update and return the admin', async () => {
			const dto: UpdateAdminDto = { username: 'new' };
			const updated = { id: adminId, username: 'new' };
			mockPrisma.admin.update.mockResolvedValue(updated);

			const result = await service.update(adminId, dto);
			expect(result).toEqual(updated);
			expect(mockPrisma.admin.update).toHaveBeenCalledWith({
				where: { id: adminId },
				data: dto,
			});
		});

		it('should throw on error', async () => {
			mockPrisma.admin.update.mockRejectedValue(new Error('fail'));
			await expect(service.update(adminId, {})).rejects.toThrow('fail');
		});
	});

	describe('remove', () => {
		it('should delete the admin and return status/message', async () => {
			const deleted = { id: adminId };
			mockPrisma.admin.delete.mockResolvedValue(deleted);

			const result = await service.remove(adminId);
			expect(result).toEqual({
				status: 'success',
				message: `Admin with ID ${adminId} deleted successfully`,
			});
			expect(mockPrisma.admin.delete).toHaveBeenCalledWith({
				where: { id: adminId },
			});
		});

		it('should throw on error', async () => {
			mockPrisma.admin.delete.mockRejectedValue(new Error('fail'));
			await expect(service.remove(adminId)).rejects.toThrow('fail');
		});
	});
});
