import { registerAs } from '@nestjs/config';

import { CONFIG_TOKENS } from '@/configs/token.config';

export const redisConfig = registerAs(CONFIG_TOKENS.REDIS, () => ({
	url: process.env.REDIS_URL,
}));

export type RedisConfig = ReturnType<typeof redisConfig>;
