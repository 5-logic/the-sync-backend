import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { CONFIG_QUEUES } from '@/configs';

export interface EmailJobData {
	to: string | string[];
	subject: string;
	template?: string;
	context?: Record<string, any>;
	html?: string;
	text?: string;
	from?: string;
	cc?: string | string[];
	bcc?: string | string[];
	attachments?: Array<{
		filename: string;
		content: string | Buffer;
		contentType?: string;
	}>;
}

@Injectable()
export class EmailQueueService {
	constructor(
		@InjectQueue(CONFIG_QUEUES.EMAIL) private emailQueue: Queue<EmailJobData>,
	) {}

	async sendEmail(
		data: EmailJobData,
		options?: { delay?: number; priority?: number },
	) {
		return this.emailQueue.add('send-email', data, {
			delay: options?.delay,
			priority: options?.priority || 0,
			attempts: 3,
			backoff: {
				type: 'exponential',
				delay: 2000,
			},
		});
	}

	async sendBulkEmails(
		emails: EmailJobData[],
		options?: { delay?: number; priority?: number },
	) {
		const jobs = emails.map((email, index) => ({
			name: 'send-email',
			data: email,
			opts: {
				delay: options?.delay ? options.delay + index * 1000 : undefined, // Stagger bulk emails
				priority: options?.priority || 0,
				attempts: 3,
				backoff: {
					type: 'exponential',
					delay: 2000,
				},
			},
		}));

		return this.emailQueue.addBulk(jobs);
	}

	async getQueueStatus() {
		const [waiting, active, completed, failed, delayed] = await Promise.all([
			this.emailQueue.getWaiting(),
			this.emailQueue.getActive(),
			this.emailQueue.getCompleted(),
			this.emailQueue.getFailed(),
			this.emailQueue.getDelayed(),
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
		const job = await this.emailQueue.getJob(jobId);
		if (job) {
			await job.remove();
		}
	}

	async retryFailedJobs() {
		const failedJobs = await this.emailQueue.getFailed();
		return Promise.all(failedJobs.map((job) => job.retry()));
	}

	async cleanQueue(olderThan: number = 24 * 60 * 60 * 1000) {
		// 24 hours default
		await this.emailQueue.clean(olderThan, 0, 'completed');
		await this.emailQueue.clean(olderThan, 0, 'failed');
	}
}
