import { Module } from '@nestjs/common';

import { ChecklistsController } from '@/checklists/checklists.controller';
import { ChecklistsService } from '@/checklists/checklists.service';

@Module({
	controllers: [ChecklistsController],
	providers: [ChecklistsService],
})
export class ChecklistsModule {}
