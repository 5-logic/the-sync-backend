import { Module } from '@nestjs/common';

import {
	ChecklistItemLecturerController,
	ChecklistItemModeratorController,
} from '@/checklists/checklist-items/controllers';
import {
	ChecklistItemLecturerService,
	ChecklistItemModeratorService,
} from '@/checklists/checklist-items/services';

@Module({
	controllers: [
		ChecklistItemModeratorController,
		ChecklistItemLecturerController,
	],
	providers: [ChecklistItemModeratorService, ChecklistItemLecturerService],
})
export class ChecklistItemModule {}
