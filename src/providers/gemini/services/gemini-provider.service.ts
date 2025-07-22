import { GoogleGenAI } from '@google/genai';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { GeminiConfig, geminiConfig } from '@/configs';

@Injectable()
export class GeminiProviderService {
	private readonly logger = new Logger(GeminiProviderService.name);

	private geminiClient: GoogleGenAI;

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
		return this.geminiConfiguration.modelName;
	}
}
