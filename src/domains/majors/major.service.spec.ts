import { Test, TestingModule } from '@nestjs/testing';

import { CreateMajorDto } from '@/majors/dto/create-major.dto';
import { MajorService } from '@/majors/major.service';
import { PrismaService } from '@/providers/prisma.service';

const mockPrisma = {
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
				{ provide: PrismaService, useValue: mockPrisma },
			],
		}).compile();

		service = module.get<MajorService>(MajorService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should create a major', async () => {
		const dto = { name: 'Software Engineering', code: 'SE' };
		const result = { id: '1', ...dto };
		mockPrisma.major.create.mockResolvedValue(result);

		expect(await service.create(dto as CreateMajorDto)).toEqual(result);
		expect(mockPrisma.major.create).toHaveBeenCalledWith({ data: dto });
	});

	it('should return all majors', async () => {
		const result = [{ id: '1', name: 'Software Engineering', code: 'SE' }];
		mockPrisma.major.findMany.mockResolvedValue(result);

		expect(await service.findAll()).toEqual(result);
		expect(mockPrisma.major.findMany).toHaveBeenCalled();
	});

	it('should return a major by id', async () => {
		const result = { id: '1', name: 'Software Engineering', code: 'SE' };
		mockPrisma.major.findUnique.mockResolvedValue(result);

		expect(await service.findOne('1')).toEqual(result);
		expect(mockPrisma.major.findUnique).toHaveBeenCalledWith({
			where: { id: '1' },
		});
	});

	it('should update a major', async () => {
		const dto = { name: 'Software Engineering', code: 'IT' };
		const result = { id: '1', ...dto };
		mockPrisma.major.update.mockResolvedValue(result);

		expect(await service.update('1', dto as CreateMajorDto)).toEqual(result);
		expect(mockPrisma.major.update).toHaveBeenCalledWith({
			where: { id: '1' },
			data: dto,
		});
	});

	it('should remove a major', async () => {
		const result = { id: '1', name: 'Software Engineering', code: 'IT' };
		mockPrisma.major.delete.mockResolvedValue(result);

		expect(await service.remove('1')).toEqual(result);
		expect(mockPrisma.major.delete).toHaveBeenCalledWith({
			where: { id: '1' },
		});
	});
});
