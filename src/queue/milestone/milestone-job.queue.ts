import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { MILESTONE_QUEUE } from '@/queue/milestone/milestone.constant';

export interface MilestoneJobData {
	milestoneId: string;
	milestoneName: string;
	startDate: Date;
	semesterId: string;
}

@Processor(MILESTONE_QUEUE.NAME)
export class MilestoneJobProcessor extends WorkerHost {
	private readonly logger = new Logger(MilestoneJobProcessor.name);

	async process(job: Job<MilestoneJobData>): Promise<void> {
		this.logger.log(
			`Processing milestone job for milestone: ${job.data.milestoneId}`,
		);

		try {
			// Thực hiện việc A tại đây
			await this.executeTaskA(job.data);

			this.logger.log(
				`Successfully completed task A for milestone: ${job.data.milestoneId}`,
			);
		} catch (error) {
			this.logger.error(
				`Failed to process task A for milestone: ${job.data.milestoneId}`,
				error,
			);
			throw error;
		}
	}

	private async executeTaskA(data: MilestoneJobData): Promise<void> {
		// TODO: Implement logic cho việc A
		// Ví dụ: gửi notification, cập nhật trạng thái, etc.

		this.logger.log(`Executing Task A for milestone: ${data.milestoneName}`);
		this.logger.log(`Milestone starts on: ${data.startDate.toISOString()}`);
		this.logger.log(`Current time: ${new Date().toISOString()}`);

		// Placeholder logic - thay thế bằng logic thực tế của bạn
		await new Promise((resolve) => setTimeout(resolve, 1000));

		this.logger.log(`Task A completed for milestone: ${data.milestoneId}`);
	}
}
