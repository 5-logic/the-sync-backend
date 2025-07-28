import { Module } from '@nestjs/common';

import {
	GroupLecturerController,
	GroupModeratorController,
	GroupPublicController,
	GroupStudentController,
} from '@/groups/controllers';
import {
	GroupLecturerService,
	GroupModeratorService,
	GroupPublicService,
	GroupStudentService,
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
	],
	providers: [
		GroupModeratorService,
		GroupStudentService,
		GroupPublicService,
		GroupLecturerService,
		GroupService,
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
