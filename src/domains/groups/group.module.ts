import { Module } from '@nestjs/common';

import {
	GroupAdminController,
	GroupLecturerController,
	GroupModeratorController,
	GroupPublicController,
	GroupStudentController,
	GroupSubmissionPublicController,
	GroupSubmissionStudentController,
} from '@/groups/controllers';
import {
	GroupAdminService,
	GroupLecturerService,
	GroupModeratorService,
	GroupPublicService,
	GroupStudentService,
	GroupSubmissionPublicService,
	GroupSubmissionService,
	GroupSubmissionStudentService,
} from '@/groups/services';
import { GroupService } from '@/groups/services/group.service';
import { EmailModule } from '@/queue/email/email.module';
import { SubmissionModule } from '@/submissions/submission.module';

@Module({
	imports: [EmailModule, SubmissionModule],
	controllers: [
		GroupAdminController,
		GroupModeratorController,
		GroupStudentController,
		GroupPublicController,
		GroupLecturerController,
		GroupSubmissionPublicController,
		GroupSubmissionStudentController,
	],
	providers: [
		GroupAdminService,
		GroupModeratorService,
		GroupStudentService,
		GroupPublicService,
		GroupLecturerService,
		GroupService,
		GroupSubmissionPublicService,
		GroupSubmissionStudentService,
		GroupSubmissionService,
	],
	exports: [
		GroupModeratorService,
		GroupStudentService,
		GroupPublicService,
		GroupLecturerService,
		GroupService,
	],
})
export class GroupModule {}
