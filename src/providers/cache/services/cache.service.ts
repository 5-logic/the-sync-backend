import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CONSTANTS } from '@/configs';

@Injectable()
export class CacheHelperService {
	private readonly logger = new Logger(CacheHelperService.name);

	constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

	async getFromCache<T>(key: string): Promise<T | null> {
		const cached = await this.cache.get<T>(key);

		if (cached) {
			this.logger.log(`Cache hit: ${key}`);
			this.logger.debug(`Cached value: ${JSON.stringify(cached)}`);

			return cached;
		}

		this.logger.log(`Cache miss: ${key}`);

		return null;
	}

	async saveToCache<T>(
		key: string,
		value: T,
		ttl = CONSTANTS.TTL,
	): Promise<void> {
		this.logger.log(`Saving cache: ${key}`);
		this.logger.debug(`Value to cache: ${JSON.stringify(value)}`);

		await this.cache.set(key, value, ttl);
	}

	async delete(key: string) {
		this.logger.log(`Deleting cache: ${key}`);

		await this.cache.del(key);
	}
}
