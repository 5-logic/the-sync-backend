import { Module } from '@nestjs/common';

import {
	ThesisLecturerController,
	ThesisModeratorController,
	ThesisPublishController,
} from '@/theses/controllers';
import {
	ThesisLecturerService,
	ThesisModeratorService,
	ThesisPublishService,
} from '@/theses/services';

@Module({
	controllers: [
		ThesisLecturerController,
		ThesisModeratorController,
		ThesisPublishController,
	],
	providers: [
		ThesisLecturerService,
		ThesisModeratorService,
		ThesisPublishService,
	],
	exports: [
		ThesisLecturerService,
		ThesisModeratorService,
		ThesisPublishService,
	],
})
export class ThesisModule {}
