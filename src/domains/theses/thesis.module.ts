import { Module } from '@nestjs/common';

import { PrismaService } from '@/providers/prisma.service';
import { ThesisController } from '@/theses/thesis.controller';
import { ThesisService } from '@/theses/thesis.service';

@Module({
	imports: [],
	controllers: [ThesisController],
	providers: [ThesisService, PrismaService],
	exports: [ThesisService],
})
export class ThesisModule {}
