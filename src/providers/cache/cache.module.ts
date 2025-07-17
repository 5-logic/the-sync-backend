import { Global, Module } from '@nestjs/common';

import { CacheHelperService } from '@/providers/cache/cache.service';

@Global()
@Module({
	providers: [CacheHelperService],
	exports: [CacheHelperService],
})
export class CacheHelperModule {}
