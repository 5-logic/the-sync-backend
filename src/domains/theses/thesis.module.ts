import { Module } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';
import { ThesisController } from '@/theses/thesis.controller';
import { ThesisService } from '@/theses/thesis.service';

@Module({
	controllers: [ThesisController],
	providers: [ThesisService, PrismaService],
})
export class ThesisModule {}
