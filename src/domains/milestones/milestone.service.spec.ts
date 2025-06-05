import { Test, TestingModule } from '@nestjs/testing';

import { MilestoneService } from '@/milestones/milestone.service';
import { PrismaService } from '@/providers/prisma.service';

const mockMilestone = {
	id: 'milestone-id',
	name: 'Review 1',
	startDate: '2024-01-01T00:00:00.000Z',
	endDate: '2024-02-01T00:00:00.000Z',
	semesterId: 'semester-id',
	trackingDetails: [{ id: 'td-1' }, { id: 'td-2' }],
};

const mockMilestones = [
	{
		...mockMilestone,
		trackingDetails: [{ id: 'td-1' }, { id: 'td-2' }],
	},
	{
		id: 'milestone-id-2',
		name: 'Review 2',
		startDate: '2024-03-01T00:00:00.000Z',
		endDate: '2024-04-01T00:00:00.000Z',
		semesterId: 'semester-id',
		trackingDetails: [{ id: 'td-3' }],
	},
];

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
		it('should create a milestone and return trackingDetails as array of ids', async () => {
			prismaMock.milestone.create.mockResolvedValue(mockMilestone);
			const dto = { ...mockMilestone };
			const result = await service.create(dto);
			expect(prismaMock.milestone.create).toHaveBeenCalledWith({
				data: dto,
				include: { trackingDetails: { select: { id: true } } },
			});
			expect(result).toEqual({
				...mockMilestone,
				trackingDetails: ['td-1', 'td-2'],
			});
		});

		it('should throw error if create fails', async () => {
			const dto = { ...mockMilestone };
			prismaMock.milestone.create.mockRejectedValue(new Error('fail'));
			await expect(service.create(dto)).rejects.toThrow('fail');
		});
	});

	function mapMilestoneTrackingDetails(milestone) {
		return {
			...milestone,
			trackingDetails: milestone.trackingDetails.map((td) => td.id),
		};
	}

	describe('findAll', () => {
		it('should return all milestones with trackingDetails as array of ids', async () => {
			prismaMock.milestone.findMany.mockResolvedValue(mockMilestones);
			const result = await service.findAll();
			expect(prismaMock.milestone.findMany).toHaveBeenCalledWith({
				include: { trackingDetails: { select: { id: true } } },
			});
			const expected = mockMilestones.map(mapMilestoneTrackingDetails);
			expect(result).toEqual(expected);
		});

		it('should throw error if findMany fails', async () => {
			prismaMock.milestone.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.findAll()).rejects.toThrow('fail');
		});
	});

	describe('findOne', () => {
		it('should return a milestone by id with trackingDetails as array of ids', async () => {
			prismaMock.milestone.findUnique.mockResolvedValue(mockMilestone);
			const result = await service.findOne('milestone-id');
			expect(prismaMock.milestone.findUnique).toHaveBeenCalledWith({
				where: { id: 'milestone-id' },
				include: { trackingDetails: { select: { id: true } } },
			});
			expect(result).toEqual({
				...mockMilestone,
				trackingDetails: ['td-1', 'td-2'],
			});
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
		it('should update a milestone and return trackingDetails as array of ids', async () => {
			prismaMock.milestone.update.mockResolvedValue(mockMilestone);
			const dto = { ...mockMilestone };
			const result = await service.update('milestone-id', dto);
			expect(prismaMock.milestone.update).toHaveBeenCalledWith({
				where: { id: 'milestone-id' },
				data: dto,
				include: { trackingDetails: { select: { id: true } } },
			});
			expect(result).toEqual({
				...mockMilestone,
				trackingDetails: ['td-1', 'td-2'],
			});
		});

		it('should throw error if update fails', async () => {
			const dto = { ...mockMilestone };
			prismaMock.milestone.update.mockRejectedValue(new Error('fail'));
			await expect(service.update('milestone-id', dto)).rejects.toThrow('fail');
		});
	});

	describe('remove', () => {
		it('should delete a milestone and return status/message', async () => {
			prismaMock.milestone.delete.mockResolvedValue(mockMilestone);
			const result = await service.remove('milestone-id');
			expect(prismaMock.milestone.delete).toHaveBeenCalledWith({
				where: { id: 'milestone-id' },
			});
			expect(result).toEqual({
				status: 'success',
				message: `Milestone with ID ${mockMilestone.id} deleted successfully`,
			});
		});

		it('should throw error if delete fails', async () => {
			prismaMock.milestone.delete.mockRejectedValue(new Error('fail'));
			await expect(service.remove('milestone-id')).rejects.toThrow('fail');
		});
	});
});
