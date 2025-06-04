import { Module } from '@nestjs/common';

import { MajorController } from '@/majors/major.controller';
import { MajorService } from '@/majors/major.service';
import { PrismaService } from '@/providers/prisma.service';

@Module({
	imports: [],
	controllers: [MajorController],
	providers: [MajorService, PrismaService],
	exports: [MajorService],
})
export class MajorModule {}
