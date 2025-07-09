import { Module } from '@nestjs/common';

import { SubmissionController } from '@/submissions/submission.controller';
import { SubmissionService } from '@/submissions/submission.service';

@Module({
	controllers: [SubmissionController],
	providers: [SubmissionService],
})
export class SubmissionModule {}
