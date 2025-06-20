import { Module } from '@nestjs/common';

import { LecturerController } from '@/domains/lecturers/lecturer.controller';
import { LecturerService } from '@/domains/lecturers/lecturer.service';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Module({
	controllers: [LecturerController],
	providers: [LecturerService, PrismaService],
})
export class LecturerModule {}
