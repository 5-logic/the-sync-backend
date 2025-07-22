import { registerAs } from '@nestjs/config';

import { CONFIG_TOKENS } from '@/configs/constant.config';

interface RedisInterface {
	url: string;
	bullmq: {
		username: string;
		password: string;
	};
}

export const redisConfig = registerAs(
	CONFIG_TOKENS.REDIS,
	(): RedisInterface => {
		if (
			!process.env.REDIS_URL ||
			!process.env.BULLMQ_USERNAME ||
			!process.env.BULLMQ_PASSWORD
		) {
			throw new Error(
				'Redis configuration is not properly set in environment variables',
			);
		}

		return {
			url: process.env.REDIS_URL,
			bullmq: {
				username: process.env.BULLMQ_USERNAME,
				password: process.env.BULLMQ_PASSWORD,
			},
		};
	},
);

export type RedisConfig = ReturnType<typeof redisConfig>;
