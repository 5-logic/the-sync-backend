import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { geminiConfig } from '@/configs';
import { GeminiProviderService } from '@/providers/gemini/services';

@Global()
@Module({
	imports: [ConfigModule.forFeature(geminiConfig)],
	providers: [GeminiProviderService],
	exports: [GeminiProviderService],
})
export class GeminiProviderModule {}
