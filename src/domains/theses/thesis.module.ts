import { Module } from '@nestjs/common';

import { GroupModule } from '@/groups/group.module';
import { EmailModule } from '@/queue/email/email.module';
import { ThesisController } from '@/theses/thesis.controller';
import { ThesisService } from '@/theses/thesis.service';

@Module({
	imports: [EmailModule, GroupModule],
	controllers: [ThesisController],
	providers: [ThesisService],
})
export class ThesisModule {}
