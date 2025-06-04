import { Module } from '@nestjs/common';

import { GroupModule } from '@/groups/group.module';
import { MajorModule } from '@/majors/major.module';
import { ThesisModule } from '@/theses/thesis.module';

@Module({
	imports: [ThesisModule, MajorModule, GroupModule],
})
export class DomainModule {}
