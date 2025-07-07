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

	/**
	 * Clear multiple cache keys at once
	 */
	protected async clearMultipleCache(keys: string[]): Promise<void> {
		try {
			await Promise.all(keys.map((key) => this.cacheManager.del(key)));
		} catch (error) {
			this.logger.warn(`Cache clear error for multiple keys:`, error);
		}
	}

	/**
	 * Get data with cache-aside pattern
	 * If cache miss, execute the function and cache the result
	 */
	protected async getWithCacheAside<T>(
		key: string,
		fetchFunction: () => Promise<T>,
		ttl?: number,
	): Promise<T> {
		try {
			// Try to get from cache first
			const cachedData = await this.getCachedData<T>(key);
			if (cachedData !== null) {
				return cachedData;
			}

			// Cache miss - fetch from source
			const data = await fetchFunction();

			// Cache the result
			await this.setCachedData(key, data, ttl ?? CONSTANTS.TTL);

			return data;
		} catch (error) {
			this.logger.warn(`Cache-aside error for key ${key}:`, error);
			// If cache fails, still return the data
			return await fetchFunction();
		}
	}

	/**
	 * Invalidate cache patterns for entity updates
	 * Clears both individual and list caches
	 */
	protected async invalidateEntityCache(
		entityPrefix: string,
		entityId: string,
		additionalKeys: string[] = [],
	): Promise<void> {
		const keysToDelete = [
			`${entityPrefix}:${entityId}`, // Individual entity cache
			`${entityPrefix}:all`, // All entities cache
			...additionalKeys, // Additional related caches
		];

		await this.clearMultipleCache(keysToDelete);
	}

	/**
	 * Cache data with automatic invalidation tags
	 */
	protected async setCachedDataWithTags(
		key: string,
		data: any,
		tags: string[] = [],
		ttl?: number,
	): Promise<void> {
		try {
			await this.setCachedData(key, data, ttl ?? CONSTANTS.TTL);

			// Store tags for future invalidation (if needed)
			if (tags.length > 0) {
				const tagKey = `${key}:tags`;
				await this.setCachedData(tagKey, tags, ttl ?? CONSTANTS.TTL);
			}
		} catch (error) {
			this.logger.warn(`Cache set with tags error for key ${key}:`, error);
		}
	}
}
