import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { PrismaService } from '@/providers';
import { EmailJobDto, EmailJobType, EmailQueueService } from '@/queue/email';
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

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailQueueService,
	) {
		super();
	}

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

		const students = await this.prisma.student.findMany({
			where: {
				enrollments: {
					some: {
						semesterId: data.semesterId,
					},
				},
			},
			select: {
				user: {
					select: {
						fullName: true,
						email: true,
					},
				},
			},
		});

		const dtos: EmailJobDto[] = students.map((s) => ({
			to: s.user.email,
			subject: `Reminder: Milestone ${data.milestoneName}`,
			context: {
				recipientName: s.user.fullName,
				milestoneName: data.milestoneName,
				startDate: data.startDate.toLocaleDateString('en-GB'),
			},
		}));

		await this.email.sendBulkEmails(
			EmailJobType.SEND_MILESTONE_REMINDER_NOTIFICATION,
			dtos,
			500,
		);

		this.logger.log(`Task A completed for milestone: ${data.milestoneId}`);
	}
}
