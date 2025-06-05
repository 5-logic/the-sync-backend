import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/providers/prisma.service';
import { CreateThesisDto } from '@/theses/dto/create-thesis.dto';
import { UpdateThesisDto } from '@/theses/dto/update-thesis.dto';
import { ThesisService } from '@/theses/thesis.service';

const mockPrisma = {
	thesis: {
		create: jest.fn(),
		findMany: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	user: {
		findUnique: jest.fn(),
	},
};

describe('ThesisService', () => {
	let service: ThesisService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ThesisService,
				{ provide: PrismaService, useValue: mockPrisma },
			],
		}).compile();

		service = module.get<ThesisService>(ThesisService);

		jest.clearAllMocks();
	});

	it('should create a thesis', async () => {
		const dto: CreateThesisDto = {
			englishName: 'AI Thesis',
			vietnameseName: 'Luận văn AI',
			abbreviation: 'AIT',
			context: 'Research on AI',
			supportingDocument: 'doc.pdf',
			status: 'New',
			expectedOutcome: 'Publication',
			requiredSkills: 'Python',
			suggestedTechnologies: 'TensorFlow',
			domain: 'AI',
		};
		const userId = 'user-1';
		const user = { id: userId };
		const prismaResult = {
			id: 'thesis-1',
			...dto,
			userId,
			group: { id: 'group-1' },
		};
		const expectedResult = {
			...prismaResult,
			group: 'group-1',
		};

		mockPrisma.user.findUnique.mockResolvedValue(user);
		mockPrisma.thesis.create.mockResolvedValue(prismaResult);

		expect(await service.create(dto, userId)).toEqual(expectedResult);
		expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
			where: { id: userId },
		});
		expect(mockPrisma.thesis.create).toHaveBeenCalledWith({
			data: { ...dto, userId },
			include: { group: { select: { id: true } } },
		});
	});

	it('should throw error if user not found when creating thesis', async () => {
		const dto: CreateThesisDto = {
			englishName: 'AI Thesis',
			vietnameseName: 'Luận văn AI',
			abbreviation: 'AIT',
			context: 'Research on AI',
			supportingDocument: 'doc.pdf',
			status: 'New',
			expectedOutcome: 'Publication',
			requiredSkills: 'Python',
			suggestedTechnologies: 'TensorFlow',
			domain: 'AI',
		};
		const userId = 'user-1';
		mockPrisma.user.findUnique.mockResolvedValue(null);

		await expect(service.create(dto, userId)).rejects.toThrow(
			`User with ID ${userId} not found`,
		);
		expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
			where: { id: userId },
		});
		expect(mockPrisma.thesis.create).not.toHaveBeenCalled();
	});

	it('should throw error if create fails', async () => {
		const dto: CreateThesisDto = {
			englishName: 'AI Thesis',
			vietnameseName: 'Luận văn AI',
			abbreviation: 'AIT',
			context: 'Research on AI',
			supportingDocument: 'doc.pdf',
			status: 'New',
			expectedOutcome: 'Publication',
			requiredSkills: 'Python',
			suggestedTechnologies: 'TensorFlow',
			domain: 'AI',
		};
		const userId = 'user-1';
		const user = { id: userId };
		mockPrisma.user.findUnique.mockResolvedValue(user);
		mockPrisma.thesis.create.mockRejectedValue(new Error('fail'));
		await expect(service.create(dto, userId)).rejects.toThrow('fail');
	});

	it('should return all theses with group id', async () => {
		const prismaResult = [
			{ id: 'thesis-1', englishName: 'AI Thesis', group: { id: 'group-1' } },
			{ id: 'thesis-2', englishName: 'ML Thesis', group: null },
		];
		const expected = [
			{ id: 'thesis-1', englishName: 'AI Thesis', group: 'group-1' },
			{ id: 'thesis-2', englishName: 'ML Thesis', group: null },
		];
		mockPrisma.thesis.findMany.mockResolvedValue(prismaResult);

		expect(await service.findAll()).toEqual(expected);
		expect(mockPrisma.thesis.findMany).toHaveBeenCalledWith({
			include: { group: { select: { id: true } } },
		});
	});

	it('should throw error if findMany fails', async () => {
		mockPrisma.thesis.findMany.mockRejectedValue(new Error('fail'));
		await expect(service.findAll()).rejects.toThrow('fail');
	});

	it('should return a thesis by id with group id', async () => {
		const prismaResult = {
			id: 'thesis-1',
			englishName: 'AI Thesis',
			group: { id: 'group-1' },
		};
		const expected = {
			id: 'thesis-1',
			englishName: 'AI Thesis',
			group: 'group-1',
		};
		mockPrisma.thesis.findUnique.mockResolvedValue(prismaResult);

		expect(await service.findOne('thesis-1')).toEqual(expected);
		expect(mockPrisma.thesis.findUnique).toHaveBeenCalledWith({
			where: { id: 'thesis-1' },
			include: { group: { select: { id: true } } },
		});
	});

	it('should return null if thesis not found', async () => {
		mockPrisma.thesis.findUnique.mockResolvedValue(null);
		expect(await service.findOne('not-found')).toBeNull();
	});

	it('should throw error if findUnique fails', async () => {
		mockPrisma.thesis.findUnique.mockRejectedValue(new Error('fail'));
		await expect(service.findOne('thesis-1')).rejects.toThrow('fail');
	});

	it('should update a thesis and return with group id', async () => {
		const dto: UpdateThesisDto = { englishName: 'Updated Thesis' };
		const userId = 'user-1';
		const prismaResult = {
			id: 'thesis-1',
			...dto,
			userId,
			group: { id: 'group-1' },
		};
		const expected = { ...prismaResult, group: 'group-1' };
		mockPrisma.thesis.update.mockResolvedValue(prismaResult);

		expect(await service.update('thesis-1', dto, userId)).toEqual(expected);
		expect(mockPrisma.thesis.update).toHaveBeenCalledWith({
			where: { id: 'thesis-1' },
			data: { ...dto, userId },
			include: { group: { select: { id: true } } },
		});
	});

	it('should throw error if update fails', async () => {
		const dto: UpdateThesisDto = { englishName: 'Updated Thesis' };
		const userId = 'user-1';
		mockPrisma.thesis.update.mockRejectedValue(new Error('fail'));
		await expect(service.update('thesis-1', dto, userId)).rejects.toThrow(
			'fail',
		);
	});

	it('should remove a thesis and return status/message', async () => {
		const prismaResult = {
			id: 'thesis-1',
			englishName: 'AI Thesis',
			group: { id: 'group-1' },
		};
		const expected = {
			status: 'success',
			message: `Thesis with ID thesis-1 deleted successfully`,
		};
		mockPrisma.thesis.delete.mockResolvedValue(prismaResult);

		expect(await service.remove('thesis-1')).toEqual(expected);
		expect(mockPrisma.thesis.delete).toHaveBeenCalledWith({
			where: { id: 'thesis-1' },
		});
	});

	it('should throw error if delete fails', async () => {
		mockPrisma.thesis.delete.mockRejectedValue(new Error('fail'));
		await expect(service.remove('thesis-1')).rejects.toThrow('fail');
	});
});
