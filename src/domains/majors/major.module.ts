import { Module } from '@nestjs/common';

import { MajorController } from '@/majors/major.controller';
import { MajorService } from '@/majors/major.service';
import { PrismaService } from '@/providers/prisma.service';

@Module({
	controllers: [MajorController],
	providers: [MajorService, PrismaService],
})
export class MajorModule {}
