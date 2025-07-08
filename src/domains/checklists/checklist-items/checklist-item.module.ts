import { Module } from '@nestjs/common';

import { ChecklistItemController } from '@/checklists/checklist-items/checklist-item.controller';
import { ChecklistItemService } from '@/checklists/checklist-items/checklist-item.service';

@Module({
	controllers: [ChecklistItemController],
	providers: [ChecklistItemService],
	exports: [ChecklistItemService],
})
export class ChecklistItemModule {}
