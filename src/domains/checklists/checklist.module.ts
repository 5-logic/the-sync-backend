import { Module } from '@nestjs/common';

import { ChecklistItemModule } from '@/checklists/checklist-items/checklist-item.module';
import {
	ChecklistLecturerController,
	ChecklistModeratorController,
} from '@/checklists/controllers';
import {
	ChecklistLecturerService,
	ChecklistModeratorService,
	ChecklistService,
} from '@/checklists/services';

@Module({
	controllers: [ChecklistModeratorController, ChecklistLecturerController],
	providers: [
		ChecklistLecturerService,
		ChecklistModeratorService,
		ChecklistService,
	],
	imports: [ChecklistItemModule],
})
export class ChecklistModule {}
