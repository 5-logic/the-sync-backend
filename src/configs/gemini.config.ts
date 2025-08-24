import { registerAs } from '@nestjs/config';

import { CONFIG_TOKENS } from '@/configs/constant.config';

interface GeminiInterface {
	apiKey: string;
}

export const geminiConfig = registerAs(
	CONFIG_TOKENS.GEMINI,
	(): GeminiInterface => {
		if (!process.env.GEMINI_API_KEY) {
			throw new Error(
				'Gemini configuration is missing. Check your env/config files.',
			);
		}

		return {
			apiKey: process.env.GEMINI_API_KEY,
		};
	},
);

export type GeminiConfig = ReturnType<typeof geminiConfig>;
