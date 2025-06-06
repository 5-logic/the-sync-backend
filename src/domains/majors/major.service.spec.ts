import { Test, TestingModule } from '@nestjs/testing';

import { CreateMajorDto } from '@/majors/dto/create-major.dto';
import { MajorService } from '@/majors/major.service';
import { PrismaService } from '@/providers/prisma/prisma.service';

const mockMajor = {
	id: '1',
	name: 'Software Engineering',
	code: 'SE',
	students: [{ userId: 'stu1' }, { userId: 'stu2' }],
};
const mockMajorWithStudentIds = {
	id: '1',
	name: 'Software Engineering',
	code: 'SE',
	students: ['stu1', 'stu2'],
};
const mockMajors = [mockMajor];
const mockMajorsWithStudentIds = [mockMajorWithStudentIds];

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
		it('should create a major and return with students id array', async () => {
			const dto = { name: 'Software Engineering', code: 'SE' };
			prismaMock.major.create.mockResolvedValue(mockMajor);

			const result = await service.create(dto as CreateMajorDto);
			expect(result).toEqual(mockMajorWithStudentIds);
			expect(prismaMock.major.create).toHaveBeenCalledWith({
				data: dto,
				include: {
					students: { select: { userId: true } },
				},
			});
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
		it('should return all majors with students id array', async () => {
			prismaMock.major.findMany.mockResolvedValue(mockMajors);

			const result = await service.findAll();
			expect(result).toEqual(mockMajorsWithStudentIds);
			expect(prismaMock.major.findMany).toHaveBeenCalledWith({
				include: {
					students: { select: { userId: true } },
				},
			});
		});

		it('should throw error if findMany fails', async () => {
			prismaMock.major.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.findAll()).rejects.toThrow('fail');
		});
	});

	describe('findOne', () => {
		it('should return a major by id with students id array', async () => {
			prismaMock.major.findUnique.mockResolvedValue(mockMajor);

			const result = await service.findOne('1');
			expect(result).toEqual(mockMajorWithStudentIds);
			expect(prismaMock.major.findUnique).toHaveBeenCalledWith({
				where: { id: '1' },
				include: {
					students: { select: { userId: true } },
				},
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
		it('should update a major and return with students id array', async () => {
			const dto = { name: 'Software Engineering', code: 'IT' };
			const updatedMajor = {
				id: '1',
				...dto,
				students: [{ userId: 'stu1' }, { userId: 'stu2' }],
			};
			const updatedMajorWithStudentIds = {
				id: '1',
				...dto,
				students: ['stu1', 'stu2'],
			};
			prismaMock.major.update.mockResolvedValue(updatedMajor);

			const result = await service.update('1', dto as CreateMajorDto);
			expect(result).toEqual(updatedMajorWithStudentIds);
			expect(prismaMock.major.update).toHaveBeenCalledWith({
				where: { id: '1' },
				data: dto,
				include: {
					students: { select: { userId: true } },
				},
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

			expect(await service.remove('1')).toEqual({
				status: 'success',
				message: `Major with ID ${result.id} deleted successfully`,
			});
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
