// Test script để kiểm tra Milestone Job Service
// Chạy bằng: npm run start:dev và test qua API
import { Test, TestingModule } from '@nestjs/testing';

import { MilestoneJobService } from '@/queue/milestone';

describe('MilestoneJobService', () => {
	let service: MilestoneJobService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [MilestoneJobService],
		}).compile();

		service = module.get<MilestoneJobService>(MilestoneJobService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	// Test example
	describe('scheduleTaskA', () => {
		it('should schedule a job for future date', async () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 10); // 10 ngày sau

			const jobId = await service.scheduleTask(
				'test-milestone-id',
				'Test Milestone',
				futureDate,
				'test-semester-id',
			);

			expect(jobId).toBeDefined();
		});

		it('should not schedule job for past date', async () => {
			const pastDate = new Date();
			pastDate.setDate(pastDate.getDate() - 1); // 1 ngày trước

			const jobId = await service.scheduleTask(
				'test-milestone-id',
				'Test Milestone',
				pastDate,
				'test-semester-id',
			);

			expect(jobId).toBe('');
		});
	});
});
