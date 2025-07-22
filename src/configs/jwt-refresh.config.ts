import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

import { CONFIG_TOKENS } from '@/configs/constant.config';

export const jwtRefreshConfig = registerAs(
	CONFIG_TOKENS.JWT_REFRESH,
	(): JwtModuleOptions => {
		if (!process.env.JWT_REFRESH_TOKEN_SECRET) {
			throw new Error(
				'JWT Refresh Token Secret is not set in environment variables',
			);
		}

		return {
			secret: process.env.JWT_REFRESH_TOKEN_SECRET,
			signOptions: {
				expiresIn: '7d',
			},
		};
	},
);

export type JWTRefreshConfig = ReturnType<typeof jwtRefreshConfig>;
