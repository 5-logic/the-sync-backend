import { Module } from '@nestjs/common';

import { AdminController } from '@/admins/controllers';
import { AdminService } from '@/admins/services';

@Module({
	controllers: [AdminController],
	providers: [AdminService],
	exports: [AdminService],
})
export class AdminModule {}
