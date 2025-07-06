import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CONSTANTS } from '@/configs';

@Injectable()
export abstract class BaseCacheService {
	protected readonly logger: Logger;

	constructor(
		@Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
		loggerContext: string,
	) {
		this.logger = new Logger(loggerContext);
	}

	protected async getCachedData<T>(key: string): Promise<T | null> {
		try {
			const result = await this.cacheManager.get<T>(key);
			return result ?? null;
		} catch (error) {
			this.logger.warn(`Cache get error for key ${key}:`, error);
			return null;
		}
	}

	protected async setCachedData(
		key: string,
		data: any,
		ttl?: number,
	): Promise<void> {
		try {
			await this.cacheManager.set(key, data, ttl ?? CONSTANTS.TTL);
		} catch (error) {
			this.logger.warn(`Cache set error for key ${key}:`, error);
		}
	}

	protected async clearCache(key: string): Promise<void> {
		try {
			await this.cacheManager.del(key);
		} catch (error) {
			this.logger.warn(`Cache clear error for key ${key}:`, error);
		}
	}
}
