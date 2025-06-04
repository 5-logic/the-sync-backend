import { Test, TestingModule } from '@nestjs/testing';

import { CreateMajorDto } from '@/majors/dto/create-major.dto';
import { MajorService } from '@/majors/major.service';
import { PrismaService } from '@/providers/prisma.service';

const mockMajor = { id: '1', name: 'Software Engineering', code: 'SE' };
const mockMajors = [mockMajor];

const prismaMock = {
	major: {
		create: jest.fn(),
		findMany: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
};

describe('MajorService', () => {
	let service: MajorService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MajorService,
				{ provide: PrismaService, useValue: prismaMock },
			],
		}).compile();

		service = module.get<MajorService>(MajorService);

		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a major', async () => {
			const dto = { name: 'Software Engineering', code: 'SE' };
			const result = { id: '1', ...dto };
			prismaMock.major.create.mockResolvedValue(result);

			expect(await service.create(dto as CreateMajorDto)).toEqual(result);
			expect(prismaMock.major.create).toHaveBeenCalledWith({ data: dto });
		});

		it('should throw error if create fails', async () => {
			const dto = { name: 'Software Engineering', code: 'SE' };
			prismaMock.major.create.mockRejectedValue(new Error('fail'));
			await expect(service.create(dto as CreateMajorDto)).rejects.toThrow(
				'fail',
			);
		});
	});

	describe('findAll', () => {
		it('should return all majors', async () => {
			prismaMock.major.findMany.mockResolvedValue(mockMajors);

			expect(await service.findAll()).toEqual(mockMajors);
			expect(prismaMock.major.findMany).toHaveBeenCalled();
		});

		it('should throw error if findMany fails', async () => {
			prismaMock.major.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.findAll()).rejects.toThrow('fail');
		});
	});

	describe('findOne', () => {
		it('should return a major by id', async () => {
			prismaMock.major.findUnique.mockResolvedValue(mockMajor);

			expect(await service.findOne('1')).toEqual(mockMajor);
			expect(prismaMock.major.findUnique).toHaveBeenCalledWith({
				where: { id: '1' },
			});
		});

		it('should return null if major not found', async () => {
			prismaMock.major.findUnique.mockResolvedValue(null);

			const result = await service.findOne('not-found');
			expect(result).toBeNull();
		});

		it('should throw error if findUnique fails', async () => {
			prismaMock.major.findUnique.mockRejectedValue(new Error('fail'));
			await expect(service.findOne('1')).rejects.toThrow('fail');
		});
	});

	describe('update', () => {
		it('should update a major', async () => {
			const dto = { name: 'Software Engineering', code: 'IT' };
			const result = { id: '1', ...dto };
			prismaMock.major.update.mockResolvedValue(result);

			expect(await service.update('1', dto as CreateMajorDto)).toEqual(result);
			expect(prismaMock.major.update).toHaveBeenCalledWith({
				where: { id: '1' },
				data: dto,
			});
		});

		it('should throw error if update fails', async () => {
			const dto = { name: 'Software Engineering', code: 'IT' };
			prismaMock.major.update.mockRejectedValue(new Error('fail'));
			await expect(service.update('1', dto as CreateMajorDto)).rejects.toThrow(
				'fail',
			);
		});
	});

	describe('remove', () => {
		it('should remove a major', async () => {
			const result = { id: '1', name: 'Software Engineering', code: 'IT' };
			prismaMock.major.delete.mockResolvedValue(result);

			expect(await service.remove('1')).toEqual(result);
			expect(prismaMock.major.delete).toHaveBeenCalledWith({
				where: { id: '1' },
			});
		});

		it('should throw error if delete fails', async () => {
			prismaMock.major.delete.mockRejectedValue(new Error('fail'));
			await expect(service.remove('1')).rejects.toThrow('fail');
		});
	});
});
