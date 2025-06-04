import { Module } from '@nestjs/common';

import { MajorModule } from '@/majors/major.module';
import { ThesisModule } from '@/theses/thesis.module';

@Module({
	imports: [ThesisModule, MajorModule],
})
export class DomainModule {}
