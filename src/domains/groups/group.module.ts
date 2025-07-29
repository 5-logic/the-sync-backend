import { Module } from '@nestjs/common';

import {
	GroupLecturerController,
	GroupModeratorController,
	GroupPublicController,
	GroupStudentController,
	GroupSubmissionPublicController,
	GroupSubmissionStudentController,
} from '@/groups/controllers';
import {
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

@Module({
	imports: [EmailModule],
	controllers: [
		GroupModeratorController,
		GroupStudentController,
		GroupPublicController,
		GroupLecturerController,
		GroupSubmissionPublicController,
		GroupSubmissionStudentController,
	],
	providers: [
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
