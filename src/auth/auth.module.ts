import { Module } from '@nestjs/common';

import { AdminModule } from '@/admins/admin.module';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { UserModule } from '@/users/user.module';

@Module({
	imports: [AdminModule, UserModule],
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
