import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Transporter, createTransport } from 'nodemailer';
import { join } from 'path';
import { renderFile } from 'pug';

import { CONFIG_QUEUES, EmailConfig, emailConfig } from '@/configs';
import { EmailJobDto } from '@/email/dto/email-job.dto';

@Processor(CONFIG_QUEUES.EMAIL)
export class EmailConsumer extends WorkerHost {
	private readonly logger = new Logger(EmailConsumer.name);

	private transporter: Transporter;

	constructor(
		@Inject(emailConfig.KEY) private readonly emailConfiguration: EmailConfig,
	) {
		super();

		this.transporter = createTransport({
			host: this.emailConfiguration.host,
			port: this.emailConfiguration.port,
			auth: {
				user: this.emailConfiguration.user,
				pass: this.emailConfiguration.pass,
			},
		});

		this.logger.debug(
			'EmailConsumer initialized with configuration:',
			this.emailConfiguration,
		);
		this.logger.log('Email transport initialized successfully.');
	}

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
		const recipient = data.to;

		const html = this.render(template, data.context);

		this.logger.log(`Sending email to: ${recipient}`);
		this.logger.log(`Subject: ${data.subject}`);

		await this.transporter.sendMail({
			to: data.to,
			subject: data.subject,
			html: html,
		});

		this.logger.log(`Email sent successfully to: ${recipient}`);
	}

	render(name: string, data: Record<string, any>): string {
		const filePath = join(__dirname, `/templates/${name}.pug`);

		return renderFile(filePath, data);
	}
}
