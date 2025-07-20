import { Global, Module } from '@nestjs/common';

import { CacheHelperService } from '@/providers/cache/services';

@Global()
@Module({
	providers: [CacheHelperService],
	exports: [CacheHelperService],
})
export class CacheHelperModule {}
