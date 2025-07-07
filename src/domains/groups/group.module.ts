import { Module } from '@nestjs/common';

import { GroupController } from '@/groups/group.controller';
import { GroupService } from '@/groups/group.service';
import { EmailModule } from '@/queue/email/email.module';

@Module({
	imports: [EmailModule],
	controllers: [GroupController],
	providers: [GroupService],
	exports: [GroupService],
})
export class GroupModule {}
