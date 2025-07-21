import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { pineconeConfig } from '@/configs';
import { PineconeProviderService } from '@/providers/pinecone/services';

@Global()
@Module({
	imports: [ConfigModule.forFeature(pineconeConfig)],
	providers: [PineconeProviderService],
	exports: [PineconeProviderService],
})
export class PineconeProviderModule {}
