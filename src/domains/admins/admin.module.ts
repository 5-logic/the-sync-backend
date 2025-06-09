import { Module } from '@nestjs/common';

import { AdminController } from '@/admins/admin.controller';
import { AdminService } from '@/admins/admin.service';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Module({
	controllers: [AdminController],
	providers: [AdminService, PrismaService],
})
export class AdminModule {}
