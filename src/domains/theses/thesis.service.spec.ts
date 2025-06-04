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
		const result = { id: '1', ...dto, userId };
		mockPrisma.thesis.create.mockResolvedValue(result);

		expect(await service.create(dto, userId)).toEqual(result);
		expect(mockPrisma.thesis.create).toHaveBeenCalledWith({
			data: { ...dto, userId },
		});
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
		mockPrisma.thesis.create.mockRejectedValue(new Error('fail'));
		await expect(service.create(dto, userId)).rejects.toThrow('fail');
	});

	it('should return all theses', async () => {
		const result = [{ id: '1', englishName: 'AI Thesis' }];
		mockPrisma.thesis.findMany.mockResolvedValue(result);

		expect(await service.findAll()).toEqual(result);
		expect(mockPrisma.thesis.findMany).toHaveBeenCalled();
	});

	it('should throw error if findMany fails', async () => {
		mockPrisma.thesis.findMany.mockRejectedValue(new Error('fail'));
		await expect(service.findAll()).rejects.toThrow('fail');
	});

	it('should return a thesis by id', async () => {
		const result = { id: '1', englishName: 'AI Thesis' };
		mockPrisma.thesis.findUnique.mockResolvedValue(result);

		expect(await service.findOne('1')).toEqual(result);
		expect(mockPrisma.thesis.findUnique).toHaveBeenCalledWith({
			where: { id: '1' },
		});
	});

	it('should throw error if findUnique fails', async () => {
		mockPrisma.thesis.findUnique.mockRejectedValue(new Error('fail'));
		await expect(service.findOne('1')).rejects.toThrow('fail');
	});

	it('should update a thesis', async () => {
		const dto: UpdateThesisDto = { englishName: 'Updated Thesis' };
		const userId = 'user-1';
		const result = { id: '1', ...dto, userId };
		mockPrisma.thesis.update.mockResolvedValue(result);

		expect(await service.update('1', dto, userId)).toEqual(result);
		expect(mockPrisma.thesis.update).toHaveBeenCalledWith({
			where: { id: '1' },
			data: { ...dto, userId },
		});
	});

	it('should throw error if update fails', async () => {
		const dto: UpdateThesisDto = { englishName: 'Updated Thesis' };
		const userId = 'user-1';
		mockPrisma.thesis.update.mockRejectedValue(new Error('fail'));
		await expect(service.update('1', dto, userId)).rejects.toThrow('fail');
	});

	it('should remove a thesis', async () => {
		const result = { id: '1', englishName: 'AI Thesis' };
		mockPrisma.thesis.delete.mockResolvedValue(result);

		expect(await service.remove('1')).toEqual(result);
		expect(mockPrisma.thesis.delete).toHaveBeenCalledWith({
			where: { id: '1' },
		});
	});

	it('should throw error if delete fails', async () => {
		mockPrisma.thesis.delete.mockRejectedValue(new Error('fail'));
		await expect(service.remove('1')).rejects.toThrow('fail');
	});
});
