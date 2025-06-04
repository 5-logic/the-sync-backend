import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/providers/prisma.service';

import { MilestoneService } from './milestone.service';

const mockMilestone = {
	id: 'milestone-id',
	name: 'Review 1',
	startDate: '2024-01-01T00:00:00.000Z',
	endDate: '2024-02-01T00:00:00.000Z',
	semesterId: 'semester-id',
};

const mockMilestones = [mockMilestone];

const prismaMock = {
	milestone: {
		create: jest.fn(),
		findMany: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
};

describe('MilestoneService', () => {
	let service: MilestoneService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MilestoneService,
				{ provide: PrismaService, useValue: prismaMock },
			],
		}).compile();

		service = module.get<MilestoneService>(MilestoneService);

		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a milestone', async () => {
			prismaMock.milestone.create.mockResolvedValue(mockMilestone);
			const dto = { ...mockMilestone };
			const result = await service.create(dto);
			expect(prismaMock.milestone.create).toHaveBeenCalledWith({
				data: dto,
			});
			expect(result).toEqual(mockMilestone);
		});

		it('should throw error if create fails', async () => {
			const dto = { ...mockMilestone };
			prismaMock.milestone.create.mockRejectedValue(new Error('fail'));
			await expect(service.create(dto)).rejects.toThrow('fail');
		});
	});

	describe('findAll', () => {
		it('should return all milestones', async () => {
			prismaMock.milestone.findMany.mockResolvedValue(mockMilestones);
			const result = await service.findAll();
			expect(prismaMock.milestone.findMany).toHaveBeenCalled();
			expect(result).toEqual(mockMilestones);
		});

		it('should throw error if findMany fails', async () => {
			prismaMock.milestone.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.findAll()).rejects.toThrow('fail');
		});
	});

	describe('findOne', () => {
		it('should return a milestone by id', async () => {
			prismaMock.milestone.findUnique.mockResolvedValue(mockMilestone);
			const result = await service.findOne('milestone-id');
			expect(prismaMock.milestone.findUnique).toHaveBeenCalledWith({
				where: { id: 'milestone-id' },
			});
			expect(result).toEqual(mockMilestone);
		});

		it('should return null if milestone not found', async () => {
			prismaMock.milestone.findUnique.mockResolvedValue(null);
			const result = await service.findOne('not-found');
			expect(result).toBeNull();
		});

		it('should throw error if findUnique fails', async () => {
			prismaMock.milestone.findUnique.mockRejectedValue(new Error('fail'));
			await expect(service.findOne('milestone-id')).rejects.toThrow('fail');
		});
	});

	describe('update', () => {
		it('should update a milestone', async () => {
			prismaMock.milestone.update.mockResolvedValue(mockMilestone);
			const dto = { ...mockMilestone };
			const result = await service.update('milestone-id', dto);
			expect(prismaMock.milestone.update).toHaveBeenCalledWith({
				where: { id: 'milestone-id' },
				data: dto,
			});
			expect(result).toEqual(mockMilestone);
		});

		it('should throw error if update fails', async () => {
			const dto = { ...mockMilestone };
			prismaMock.milestone.update.mockRejectedValue(new Error('fail'));
			await expect(service.update('milestone-id', dto)).rejects.toThrow('fail');
		});
	});

	describe('remove', () => {
		it('should delete a milestone', async () => {
			prismaMock.milestone.delete.mockResolvedValue(mockMilestone);
			const result = await service.remove('milestone-id');
			expect(prismaMock.milestone.delete).toHaveBeenCalledWith({
				where: { id: 'milestone-id' },
			});
			expect(result).toEqual(mockMilestone);
		});

		it('should throw error if delete fails', async () => {
			prismaMock.milestone.delete.mockRejectedValue(new Error('fail'));
			await expect(service.remove('milestone-id')).rejects.toThrow('fail');
		});
	});
});
