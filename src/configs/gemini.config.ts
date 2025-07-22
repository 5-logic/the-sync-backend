import { registerAs } from '@nestjs/config';

import { CONFIG_TOKENS } from '@/configs/constant.config';

interface GeminiInterface {
	apiKey: string;
	modelName: string;
}

export const geminiConfig = registerAs(
	CONFIG_TOKENS.GEMINI,
	(): GeminiInterface => {
		if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL_NAME) {
			throw new Error(
				'Gemini configuration is missing. Check your env/config files.',
			);
		}

		return {
			apiKey: process.env.GEMINI_API_KEY,
			modelName: process.env.GEMINI_MODEL_NAME,
		};
	},
);

export type GeminiConfig = ReturnType<typeof geminiConfig>;
