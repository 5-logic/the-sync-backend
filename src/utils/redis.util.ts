import { ConfigService } from '@nestjs/config';

import { CONFIG_TOKENS, PineconeConfig, RedisConfig } from '@/configs';

export const getRedisConfigOrThrow = (
	configService: ConfigService,
): RedisConfig => {
	const config = configService.get<RedisConfig>(CONFIG_TOKENS.REDIS);

	if (!config?.url) {
		throw new Error(
			'Redis configuration is missing. Check your env/config files.',
		);
	}

	return config;
};

export const getBullBoardAuthOrThrow = (config: RedisConfig) => {
	if (!config?.bullmq?.username || !config?.bullmq?.password) {
		throw new Error('BullMQ authentication config missing.');
	}

	return {
		username: config.bullmq.username,
		password: config.bullmq.password,
	};
};

export const getPineconeConfigOrThrow = (
	configService: ConfigService,
): PineconeConfig => {
	const config = configService.get<PineconeConfig>(CONFIG_TOKENS.PINECONE);

	if (!config?.apiKey || !config?.indexName) {
		throw new Error(
			'Pinecone configuration is missing. Check your env/config files.',
		);
	}

	return config;
};
