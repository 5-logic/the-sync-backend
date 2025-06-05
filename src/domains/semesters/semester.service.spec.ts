import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/providers/prisma.service';
import { SemesterService } from '@/semesters/semester.service';

const mockSemester = {
	id: 'semester-id',
	code: 'SU25',
	name: 'Summer 2025',
	startDate: '2024-01-01T00:00:00.000Z',
	endDate: '2024-06-01T00:00:00.000Z',
	endRegistrationDate: '2023-12-01T00:00:00.000Z',
	milestones: [{ id: 'm1' }, { id: 'm2' }],
	groups: [{ id: 'g1' }, { id: 'g2' }],
};

const mockSemesterReturn = {
	...mockSemester,
	milestones: ['m1', 'm2'],
	groups: ['g1', 'g2'],
};

const mockSemesters = [
	{
		...mockSemester,
		milestones: [{ id: 'm1' }],
		groups: [{ id: 'g1' }],
	},
	{
		...mockSemester,
		id: 'semester-id-2',
		milestones: [{ id: 'm2' }],
		groups: [{ id: 'g2' }],
	},
];

const mockSemestersReturn = [
	{
		...mockSemester,
		milestones: ['m1'],
		groups: ['g1'],
	},
	{
		...mockSemester,
		id: 'semester-id-2',
		milestones: ['m2'],
		groups: ['g2'],
	},
];

const prismaMock = {
	semester: {
		create: jest.fn(),
		findMany: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
};

describe('SemesterService', () => {
	let service: SemesterService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SemesterService,
				{ provide: PrismaService, useValue: prismaMock },
			],
		}).compile();

		service = module.get<SemesterService>(SemesterService);

		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a semester and return with milestones/groups as ids', async () => {
			prismaMock.semester.create.mockResolvedValue(mockSemester);
			const dto = { ...mockSemester };
			const result = await service.create(dto);
			expect(prismaMock.semester.create).toHaveBeenCalledWith({
				data: dto,
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
			});
			expect(result).toEqual(mockSemesterReturn);
		});

		it('should throw error if create fails', async () => {
			const dto = { ...mockSemester };
			prismaMock.semester.create.mockRejectedValue(new Error('fail'));
			await expect(service.create(dto)).rejects.toThrow('fail');
		});
	});

	describe('findAll', () => {
		it('should return all semesters with milestones/groups as ids', async () => {
			prismaMock.semester.findMany.mockResolvedValue(mockSemesters);
			const result = await service.findAll();
			expect(prismaMock.semester.findMany).toHaveBeenCalledWith({
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
				orderBy: { startDate: 'asc' },
			});
			expect(result).toEqual(mockSemestersReturn);
		});

		it('should throw error if findMany fails', async () => {
			prismaMock.semester.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.findAll()).rejects.toThrow('fail');
		});
	});

	describe('findOne', () => {
		it('should return a semester by id with milestones/groups as ids', async () => {
			prismaMock.semester.findUnique.mockResolvedValue(mockSemester);
			const result = await service.findOne('semester-id');
			expect(prismaMock.semester.findUnique).toHaveBeenCalledWith({
				where: { id: 'semester-id' },
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
			});
			expect(result).toEqual(mockSemesterReturn);
		});

		it('should return null if semester not found', async () => {
			prismaMock.semester.findUnique.mockResolvedValue(null);
			const result = await service.findOne('not-found');
			expect(result).toBeNull();
		});

		it('should throw error if findUnique fails', async () => {
			prismaMock.semester.findUnique.mockRejectedValue(new Error('fail'));
			await expect(service.findOne('semester-id')).rejects.toThrow('fail');
		});
	});

	describe('update', () => {
		it('should update a semester and return with milestones/groups as ids', async () => {
			prismaMock.semester.update.mockResolvedValue(mockSemester);
			const dto = { ...mockSemester };
			const result = await service.update('semester-id', dto);
			expect(prismaMock.semester.update).toHaveBeenCalledWith({
				where: { id: 'semester-id' },
				data: dto,
				include: {
					milestones: { select: { id: true } },
					groups: { select: { id: true } },
				},
			});
			expect(result).toEqual(mockSemesterReturn);
		});

		it('should throw error if update fails', async () => {
			const dto = { ...mockSemester };
			prismaMock.semester.update.mockRejectedValue(new Error('fail'));
			await expect(service.update('semester-id', dto)).rejects.toThrow('fail');
		});
	});

	describe('remove', () => {
		it('should delete a semester and return status/message', async () => {
			prismaMock.semester.delete.mockResolvedValue(mockSemester);
			const result = await service.remove('semester-id');
			expect(prismaMock.semester.delete).toHaveBeenCalledWith({
				where: { id: 'semester-id' },
			});
			expect(result).toEqual({
				status: 'success',
				message: `Semester with ID ${mockSemester.id} deleted successfully`,
			});
		});

		it('should throw error if delete fails', async () => {
			prismaMock.semester.delete.mockRejectedValue(new Error('fail'));
			await expect(service.remove('semester-id')).rejects.toThrow('fail');
		});
	});
});
