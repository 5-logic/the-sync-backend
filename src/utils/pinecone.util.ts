import { ConfigService } from '@nestjs/config';

import { CONFIG_TOKENS, PineconeConfig } from '@/configs';

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
