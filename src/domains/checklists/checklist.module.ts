import { Module } from '@nestjs/common';

import { ChecklistItemModule } from '@/checklists/checklist-items/checklist-item.module';
import { ChecklistController } from '@/checklists/checklist.controller';
import { ChecklistService } from '@/checklists/checklist.service';

@Module({
	controllers: [ChecklistController],
	providers: [ChecklistService],
	imports: [ChecklistItemModule],
})
export class ChecklistModule {}
