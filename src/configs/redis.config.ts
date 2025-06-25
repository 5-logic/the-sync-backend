import { registerAs } from '@nestjs/config';

import { CONFIG_TOKENS } from '@/configs/token.config';

export const redisConfig = registerAs(CONFIG_TOKENS.REDIS, () => ({
	url: process.env.REDIS_URL,
	bullmq: {
		username: process.env.BULLMQ_USERNAME,
		password: process.env.BULLMQ_PASSWORD,
	},
}));

export type RedisConfig = ReturnType<typeof redisConfig>;
