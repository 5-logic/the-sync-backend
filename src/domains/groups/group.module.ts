import { Module } from '@nestjs/common';

import { GroupController } from '@/groups/group.controller';
import { GroupService } from '@/groups/group.service';

@Module({
	controllers: [GroupController],
	providers: [GroupService],
})
export class GroupModule {}
