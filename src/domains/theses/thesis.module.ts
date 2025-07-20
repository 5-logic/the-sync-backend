import { Module } from '@nestjs/common';

import { GroupModule } from '@/groups/group.module';
import { EmailModule } from '@/queue/email/email.module';
import { ThesisLecturerController } from '@/theses/controllers/thesis-lecturer.controller';
import { ThesisModeratorController } from '@/theses/controllers/thesis-moderator.controller';
import { ThesisPublishController } from '@/theses/controllers/thesis-publish.controller';
import { ThesisLecturerService } from '@/theses/services/thesis-lecturer.service';
import { ThesisModeratorService } from '@/theses/services/thesis-moderator.service';
import { ThesisPublishService } from '@/theses/services/thesis-publish.service';

@Module({
	imports: [EmailModule, GroupModule],
	controllers: [
		ThesisPublishController,
		ThesisLecturerController,
		ThesisModeratorController,
	],
	providers: [
		ThesisPublishService,
		ThesisLecturerService,
		ThesisModeratorService,
	],
})
export class ThesisModule {}
