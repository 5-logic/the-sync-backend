import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import type { MilestoneJobData } from '@/queue/milestone/milestone-job.queue';
import {
	MILESTONE_JOB_PREFIX,
	MILESTONE_QUEUE,
} from '@/queue/milestone/milestone.constant';

@Injectable()
export class MilestoneJobService {
	private readonly logger = new Logger(MilestoneJobService.name);

	constructor(
		@InjectQueue(MILESTONE_QUEUE.NAME) private readonly milestoneQueue: Queue,
	) {}

	/**
	 * Tạo job để chạy việc A trước startDate 3 ngày
	 */
	async scheduleTask(
		milestoneId: string,
		milestoneName: string,
		startDate: Date,
		semesterId: string,
	): Promise<string> {
		try {
			// Tính thời gian chạy job (trước startDate 3 ngày)
			const jobRunTime = new Date(startDate);
			jobRunTime.setDate(jobRunTime.getDate() - 3);

			// Tính delay từ thời điểm hiện tại
			const delay = jobRunTime.getTime() - Date.now();

			// Nếu thời gian đã qua thì không tạo job
			if (delay <= 0) {
				this.logger.warn(
					`Cannot schedule job for milestone ${milestoneId}: scheduled time has passed`,
				);
				return '';
			}

			const jobData: MilestoneJobData = {
				milestoneId,
				milestoneName,
				startDate,
				semesterId,
			};

			// Sử dụng milestoneId làm jobId để dễ truy xuất
			const jobId = this.generateJobId(milestoneId);

			const job = await this.milestoneQueue.add(
				MILESTONE_QUEUE.JOBS.TASK_A,
				jobData,
				{
					jobId,
					delay,
				},
			);

			this.logger.log(
				`Scheduled Task A for milestone ${milestoneId} to run at ${jobRunTime.toISOString()}`,
			);

			return job.id!;
		} catch (error) {
			this.logger.error(
				`Failed to schedule Task A for milestone ${milestoneId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Cập nhật thời gian chạy job khi startDate thay đổi
	 */
	async rescheduleTask(
		milestoneId: string,
		milestoneName: string,
		newStartDate: Date,
		semesterId: string,
	): Promise<string> {
		try {
			// Xóa job cũ trước
			await this.cancelTaskA(milestoneId);

			// Tạo job mới với thời gian mới
			return await this.scheduleTask(
				milestoneId,
				milestoneName,
				newStartDate,
				semesterId,
			);
		} catch (error) {
			this.logger.error(
				`Failed to reschedule Task A for milestone ${milestoneId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Hủy job khi milestone bị xóa
	 */
	async cancelTaskA(milestoneId: string): Promise<boolean> {
		try {
			const jobId = this.generateJobId(milestoneId);
			const job = await this.milestoneQueue.getJob(jobId);

			if (!job) {
				this.logger.warn(`Job not found for milestone ${milestoneId}`);
				return false;
			}

			// Kiểm tra job chưa được xử lý
			if (job.processedOn) {
				this.logger.warn(
					`Job for milestone ${milestoneId} has already been processed`,
				);
				return false;
			}

			await job.remove();
			this.logger.log(`Cancelled Task A for milestone ${milestoneId}`);
			return true;
		} catch (error) {
			this.logger.error(
				`Failed to cancel Task A for milestone ${milestoneId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Lấy thông tin job theo milestone ID
	 */
	async getJobStatus(milestoneId: string) {
		try {
			const jobId = this.generateJobId(milestoneId);
			const job = await this.milestoneQueue.getJob(jobId);

			if (!job) {
				return null;
			}

			return {
				id: job.id,
				name: job.name,
				data: job.data,
				processedOn: job.processedOn,
				finishedOn: job.finishedOn,
				failedReason: job.failedReason,
				delay: job.opts.delay,
				scheduledTime: job.opts.delay
					? new Date(Date.now() + Number(job.opts.delay))
					: null,
			};
		} catch (error) {
			this.logger.error(
				`Failed to get job status for milestone ${milestoneId}`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Tạo job ID từ milestone ID
	 */
	private generateJobId(milestoneId: string): string {
		return `${MILESTONE_JOB_PREFIX}-${milestoneId}`;
	}
}
