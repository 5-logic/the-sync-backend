import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AdminModule } from '@/admins/admin.module';
import {
	AdminAuthController,
	ChangePasswordController,
	PasswordResetController,
	UserAuthController,
} from '@/auth/controllers';
import {
	AdminAuthService,
	BaseAuthService,
	ChangePasswordService,
	PasswordResetService,
	TokenAuthService,
	UserAuthService,
} from '@/auth/services';
import { JwtAccessStrategy } from '@/auth/strategies';
import { jwtAccessConfig, jwtRefreshConfig } from '@/configs';
import { EmailModule } from '@/queue';
import { UserModule } from '@/users/index';

@Module({
	imports: [
		ConfigModule.forFeature(jwtAccessConfig),
		ConfigModule.forFeature(jwtRefreshConfig),
		AdminModule,
		UserModule,
		EmailModule,
		JwtModule,
	],
	controllers: [
		AdminAuthController,
		ChangePasswordController,
		PasswordResetController,
		UserAuthController,
	],
	providers: [
		AdminAuthService,
		BaseAuthService,
		ChangePasswordService,
		PasswordResetService,
		TokenAuthService,
		UserAuthService,
		JwtAccessStrategy,
	],
})
export class AuthModule {}
