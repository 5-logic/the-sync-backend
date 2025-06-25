import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtRefreshConfig = registerAs(
	'jwt-refresh',
	(): JwtModuleOptions => ({
		secret: process.env.JWT_REFRESH_TOKEN_SECRET,
		signOptions: {
			expiresIn: '7d',
		},
	}),
);

export type JWTRefreshConfig = ReturnType<typeof jwtRefreshConfig>;
