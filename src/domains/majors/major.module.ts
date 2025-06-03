import { Module } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';

import { MajorController } from './major.controller';
import { MajorService } from './major.service';

@Module({
	imports: [],
	controllers: [MajorController],
	providers: [MajorService, PrismaService],
	exports: [MajorService],
})
export class MajorModule {}
