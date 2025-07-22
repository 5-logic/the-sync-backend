import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

import { CONFIG_TOKENS } from '@/configs/constant.config';

export const jwtAccessConfig = registerAs(
	CONFIG_TOKENS.JWT_ACCESS,
	(): JwtModuleOptions => {
		if (!process.env.JWT_ACCESS_TOKEN_SECRET) {
			throw new Error(
				'JWT Access Token Secret is not set in environment variables',
			);
		}

		return {
			secret: process.env.JWT_ACCESS_TOKEN_SECRET,
			signOptions: {
				expiresIn: '1h',
			},
		};
	},
);

export type JWTAccessConfig = ReturnType<typeof jwtAccessConfig>;
