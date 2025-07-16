import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CACHE_KEY } from '@/auth/constants';

@Injectable()
export class BaseAuthService {
	private readonly logger = new Logger(BaseAuthService.name);

	constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

	async logout(id: string) {
		try {
			const key = `${CACHE_KEY}:${id}`;
			await this.cache.del(key);

			return;
		} catch (error) {
			this.logger.error('Error during admin logout', error);

			throw error;
		}
	}
}
