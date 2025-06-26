import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { CONFIG_QUEUES } from '@/configs';
import { EmailJobData } from '@/email/email-queue.service';

@Processor(CONFIG_QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
	private readonly logger = new Logger(EmailProcessor.name);

	async process(job: Job<EmailJobData>): Promise<void> {
		this.logger.log(`Processing email job ${job.id}`);

		try {
			switch (job.name) {
				case 'send-email':
					await this.sendEmail(job.data);
					break;
				default:
					this.logger.warn(`Unknown job type: ${job.name}`);
			}
		} catch (error) {
			this.logger.error(`Failed to process email job ${job.id}:`, error);
			throw error;
		}
	}

	private async sendEmail(data: EmailJobData): Promise<void> {
		const recipients = Array.isArray(data.to) ? data.to.join(', ') : data.to;
		this.logger.log(`Sending email to: ${recipients}`);
		this.logger.log(`Subject: ${data.subject}`);

		// TODO: Implement actual email sending logic
		// This is where you'll integrate with your email service provider
		// For example: SendGrid, AWS SES, Nodemailer, etc.

		// Simulate email sending for now
		await new Promise((resolve) => setTimeout(resolve, 1000));

		this.logger.log(`Email sent successfully to: ${recipients}`);
	}
}
