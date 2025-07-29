import { Module } from '@nestjs/common';

import { SubmissionPublicController } from '@/submissions/controllers';
import { SubmissionPublicService } from '@/submissions/services';
import { SubmissionService } from '@/submissions/services/submission.service';

@Module({
	controllers: [SubmissionPublicController],
	providers: [SubmissionPublicService, SubmissionService],
})
export class SubmissionModule {}
