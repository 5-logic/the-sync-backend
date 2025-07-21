import { Module } from '@nestjs/common';

import {
	GroupSubmissionController,
	SubmissionController,
} from '@/submissions/submission.controller';
import { SubmissionService } from '@/submissions/submission.service';

@Module({
	controllers: [SubmissionController, GroupSubmissionController],
	providers: [SubmissionService],
})
export class SubmissionModule {}
