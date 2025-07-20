import { Module } from '@nestjs/common';

import { GroupModule } from '@/groups/group.module';
import { EmailModule } from '@/queue/email/email.module';
import { ThesisLecturerController } from '@/theses/controllers/thesis-lecturer.controller';
import { ThesisModeratorController } from '@/theses/controllers/thesis-moderator.controller';
import { ThesisPublishController } from '@/theses/controllers/thesis-publish.controller';
import { ThesisLecturerService } from '@/theses/services/thesis-lecturer.service';
import { ThesisModeratorService } from '@/theses/services/thesis-moderator.service';
import { ThesisPublishService } from '@/theses/services/thesis-publish.service';
import { ThesisController } from '@/theses/thesis.controller';
import { ThesisService } from '@/theses/thesis.service';

@Module({
	imports: [EmailModule, GroupModule],
	controllers: [
		ThesisController,
		// ThesisPublishController,
		// ThesisLecturerController,
		// ThesisModeratorController,
	],
	providers: [
		ThesisService,
		// ThesisPublishService,
		// ThesisLecturerService,
		// ThesisModeratorService,
	],
})
export class ThesisModule {}
