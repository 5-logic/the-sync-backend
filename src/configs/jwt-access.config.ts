import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtAccessConfig = registerAs(
	'jwt-access',
	(): JwtModuleOptions => ({
		secret: process.env.JWT_ACCESS_TOKEN_SECRET,
		signOptions: {
			expiresIn: '1h',
		},
	}),
);

export type JWTAccessConfig = ReturnType<typeof jwtAccessConfig>;
