import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AdminModule } from '@/admins/admin.module';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { JwtAccessStrategy } from '@/auth/strategies/jwt-access.strategy';
import { jwtAccessConfig } from '@/configs/jwt-access.config';
import { jwtRefreshConfig } from '@/configs/jwt-refresh.config';
import { UserModule } from '@/users/user.module';

@Module({
	imports: [
		ConfigModule.forFeature(jwtAccessConfig),
		ConfigModule.forFeature(jwtRefreshConfig),
		AdminModule,
		UserModule,
		JwtModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtAccessStrategy],
})
export class AuthModule {}
