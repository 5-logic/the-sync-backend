import { createKeyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { Keyv } from 'keyv';

import { CONSTANTS, RedisConfig } from '@/configs';

export const createCacheStores = (config: RedisConfig) => [
	new Keyv({
		store: new CacheableMemory({
			ttl: CONSTANTS.TTL,
			lruSize: CONSTANTS.LRU_SIZE,
		}),
	}),
	createKeyv(config.url),
];
