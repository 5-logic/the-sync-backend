import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { CONFIG_QUEUES } from '@/configs';
import { EmailJobDto } from '@/email/dto/email-job.dto';

@Processor(CONFIG_QUEUES.EMAIL)
export class EmailConsumer extends WorkerHost {
	private readonly logger = new Logger(EmailConsumer.name);

	async process(job: Job<EmailJobDto>): Promise<void> {
		this.logger.log(`Processing email job ${job.id}`);

		try {
			await this.sendEmail(job.name, job.data);
		} catch (error) {
			this.logger.error(`Failed to process email job ${job.id}:`, error);

			throw error;
		}
	}

	private async sendEmail(template: string, data: EmailJobDto): Promise<void> {
		const recipients = data.to;

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
