import { Module } from '@nestjs/common';

import { ChecklistItemController } from './checklist-item.controller';
import { ChecklistItemService } from './checklist-item.service';

@Module({
	controllers: [ChecklistItemController],
	providers: [ChecklistItemService],
})
export class ChecklistItemModule {}
