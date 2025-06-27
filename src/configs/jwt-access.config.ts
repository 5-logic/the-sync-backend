import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

import { CONFIG_TOKENS } from '@/configs/constant.config';

export const jwtAccessConfig = registerAs(
	CONFIG_TOKENS.JWT_ACCESS,
	(): JwtModuleOptions => ({
		secret: process.env.JWT_ACCESS_TOKEN_SECRET,
		signOptions: {
			expiresIn: '1h',
		},
	}),
);

export type JWTAccessConfig = ReturnType<typeof jwtAccessConfig>;
