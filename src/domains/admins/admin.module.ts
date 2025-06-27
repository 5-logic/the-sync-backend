import { Module } from '@nestjs/common';

import { AdminController } from '@/admins/admin.controller';
import { AdminService } from '@/admins/admin.service';

@Module({
	controllers: [AdminController],
	providers: [AdminService],
	exports: [AdminService],
})
export class AdminModule {}
