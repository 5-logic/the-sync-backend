import { Module } from '@nestjs/common';

import { SemesterController } from '@/semesters/semester.controller';
import { SemesterService } from '@/semesters/semester.service';

@Module({
	controllers: [SemesterController],
	providers: [SemesterService],
})
export class SemesterModule {}
