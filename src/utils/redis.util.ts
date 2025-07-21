import { ConfigService } from '@nestjs/config';

import { CONFIG_TOKENS, RedisConfig } from '@/configs';

export function getRedisConfigOrThrow(
	configService: ConfigService,
): RedisConfig {
	const config = configService.get<RedisConfig>(CONFIG_TOKENS.REDIS);

	if (!config?.url) {
		throw new Error(
			'Redis configuration is missing. Check your env/config files.',
		);
	}

	return config;
}

export function getBullBoardAuthOrThrow(config: RedisConfig) {
	if (!config?.bullmq?.username || !config?.bullmq?.password) {
		throw new Error('BullMQ authentication config missing.');
	}

	return {
		username: config.bullmq.username,
		password: config.bullmq.password,
	};
}
