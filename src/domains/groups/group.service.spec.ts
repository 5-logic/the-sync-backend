import { Test, TestingModule } from '@nestjs/testing';

import { GroupService } from '@/groups/group.service';
import { PrismaService } from '@/providers/prisma.service';

const mockGroup = {
	id: 'group-id',
	code: 'G01',
	name: 'Group 1',
	description: 'desc',
	projectDescription: 'project desc',
	projectDirection: 'direction',
	requiredSkills: 'skills',
	expectedRoles: 'roles',
	thesisId: 'thesis-id',
	leaderId: 'leader-id',
	semesterId: 'semester-id',
};

const mockGroups = [mockGroup];

const prismaMock = {
	group: {
		create: jest.fn(),
		findMany: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
};

describe('GroupService', () => {
	let service: GroupService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GroupService,
				{ provide: PrismaService, useValue: prismaMock },
			],
		}).compile();

		service = module.get<GroupService>(GroupService);

		// Reset mocks before each test
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a group', async () => {
			prismaMock.group.create.mockResolvedValue(mockGroup);
			const dto = { ...mockGroup };
			const result = await service.create(dto, mockGroup.leaderId);
			expect(prismaMock.group.create).toHaveBeenCalledWith({
				data: { ...dto, leaderId: mockGroup.leaderId },
			});
			expect(result).toEqual(mockGroup);
		});

		it('should throw error if create fails', async () => {
			const dto = { ...mockGroup };
			prismaMock.group.create.mockRejectedValue(new Error('fail'));
			await expect(service.create({ ...dto }, 'leader-id')).rejects.toThrow(
				'fail',
			);
		});
	});

	describe('findAll', () => {
		it('should return all groups', async () => {
			prismaMock.group.findMany.mockResolvedValue(mockGroups);
			const result = await service.findAll();
			expect(prismaMock.group.findMany).toHaveBeenCalled();
			expect(result).toEqual(mockGroups);
		});

		it('should throw error if findMany fails', async () => {
			prismaMock.group.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.findAll()).rejects.toThrow('fail');
		});
	});

	describe('findOne', () => {
		it('should return a group by id', async () => {
			prismaMock.group.findUnique.mockResolvedValue(mockGroup);
			const result = await service.findOne('group-id');
			expect(prismaMock.group.findUnique).toHaveBeenCalledWith({
				where: { id: 'group-id' },
			});
			expect(result).toEqual(mockGroup);
		});

		it('should return null if group not found', async () => {
			prismaMock.group.findUnique.mockResolvedValue(null);
			const result = await service.findOne('not-found');
			expect(result).toBeNull();
		});

		it('should throw error if findUnique fails', async () => {
			prismaMock.group.findUnique.mockRejectedValue(new Error('fail'));
			await expect(service.findOne('group-id')).rejects.toThrow('fail');
		});
	});

	describe('update', () => {
		it('should update a group', async () => {
			prismaMock.group.update.mockResolvedValue(mockGroup);
			const dto = { ...mockGroup };
			const result = await service.update('group-id', dto, mockGroup.leaderId);
			expect(prismaMock.group.update).toHaveBeenCalledWith({
				where: { id: 'group-id' },
				data: { ...dto, leaderId: mockGroup.leaderId },
			});
			expect(result).toEqual(mockGroup);
		});

		it('should throw error if update fails', async () => {
			prismaMock.group.update.mockRejectedValue(new Error('fail'));
			await expect(service.update('group-id', {}, 'leader-id')).rejects.toThrow(
				'fail',
			);
		});
	});

	describe('remove', () => {
		it('should delete a group', async () => {
			prismaMock.group.delete.mockResolvedValue(mockGroup);
			const result = await service.remove('group-id');
			expect(prismaMock.group.delete).toHaveBeenCalledWith({
				where: { id: 'group-id' },
			});
			expect(result).toEqual(mockGroup);
		});

		it('should throw error if delete fails', async () => {
			prismaMock.group.delete.mockRejectedValue(new Error('fail'));
			await expect(service.remove('group-id')).rejects.toThrow('fail');
		});
	});
});
