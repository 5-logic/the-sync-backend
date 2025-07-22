import { registerAs } from '@nestjs/config';

import { CONFIG_TOKENS } from '@/configs/constant.config';

interface PineconeInterface {
	apiKey: string;
	indexName: string;
}

export const pineconeConfig = registerAs(
	CONFIG_TOKENS.PINECONE,
	(): PineconeInterface => {
		if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
			throw new Error(
				'Pinecone configuration is missing. Check your env/config files.',
			);
		}

		return {
			apiKey: process.env.PINECONE_API_KEY,
			indexName: process.env.PINECONE_INDEX_NAME,
		};
	},
);

export type PineconeConfig = ReturnType<typeof pineconeConfig>;
