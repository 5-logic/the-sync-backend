import { GoogleGenAI } from '@google/genai';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { GeminiConfig, geminiConfig } from '@/configs';

@Injectable()
export class GeminiProviderService {
	private readonly logger = new Logger(GeminiProviderService.name);

	private readonly geminiClient: GoogleGenAI;

	constructor(
		@Inject(geminiConfig.KEY)
		private readonly geminiConfiguration: GeminiConfig,
	) {
		this.geminiClient = new GoogleGenAI({
			apiKey: geminiConfiguration.apiKey,
		});

		this.logger.log('Gemini client initialized successfully.');
		this.logger.debug(
			`Gemini environment: ${JSON.stringify(geminiConfiguration)}`,
		);
	}

	getClient(): GoogleGenAI {
		return this.geminiClient;
	}

	getModelName(): string {
		return 'gemini-2.5-flash';
	}

	getModelLiteName(): string {
		return 'gemini-2.5-flash-lite';
	}
}
