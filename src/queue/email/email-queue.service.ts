import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { CONFIG_QUEUES } from '@/configs';
import { EmailJobDto } from '@/queue/email/dto';
import { EmailJobType } from '@/queue/email/enums';

@Injectable()
export class EmailQueueService {
	private static readonly BACKOFF_TYPE = 'exponential';
	private static readonly BACKOFF_DELAY = 2000;

	constructor(
		@InjectQueue(CONFIG_QUEUES.EMAIL)
		private readonly queue: Queue<EmailJobDto>,
	) {}

	async sendEmail(type: EmailJobType, dto: EmailJobDto, delay?: number) {
		return await this.queue.add(type, dto, {
			delay: delay ?? 0,
			attempts: 3,
			backoff: {
				type: EmailQueueService.BACKOFF_TYPE,
				delay: EmailQueueService.BACKOFF_DELAY,
			},
		});
	}

	async sendBulkEmails(
		type: EmailJobType,
		emails: EmailJobDto[],
		delay?: number,
	) {
		const jobs = emails.map((email, index) => ({
			name: type,
			data: email,
			opts: {
				delay: delay ? delay + index * 1000 : 0,
				attempts: 3,
				backoff: {
					type: EmailQueueService.BACKOFF_TYPE,
					delay: EmailQueueService.BACKOFF_DELAY,
				},
			},
		}));

		return await this.queue.addBulk(jobs);
	}

	async getQueueStatus() {
		const [waiting, active, completed, failed, delayed] = await Promise.all([
			this.queue.getWaiting(),
			this.queue.getActive(),
			this.queue.getCompleted(),
			this.queue.getFailed(),
			this.queue.getDelayed(),
		]);

		return {
			waiting: waiting.length,
			active: active.length,
			completed: completed.length,
			failed: failed.length,
			delayed: delayed.length,
		};
	}

	async removeJob(jobId: string) {
		const job = await this.queue.getJob(jobId);

		if (job) {
			await job.remove();
		}
	}

	async retryFailedJobs() {
		const failedJobs = await this.queue.getFailed();

		return await Promise.all(failedJobs.map((job) => job.retry()));
	}

	async cleanQueue(olderThan: number = 24 * 60 * 60 * 1000) {
		// 24 hours default
		await this.queue.clean(olderThan, 0, 'completed');
		await this.queue.clean(olderThan, 0, 'failed');
	}
}
