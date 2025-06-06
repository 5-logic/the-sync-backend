import { Module } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma/prisma.service';
import { SemesterController } from '@/semesters/semester.controller';
import { SemesterService } from '@/semesters/semester.service';

@Module({
	controllers: [SemesterController],
	providers: [SemesterService, PrismaService],
})
export class SemesterModule {}
