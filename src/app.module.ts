import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { createKeyv } from '@keyv/redis';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import basicAuth from 'basic-auth-connect';
import { CacheableMemory } from 'cacheable';
import Keyv from 'keyv';

import { AuthModule } from '@/auth/auth.module';
import {
	CONFIG_MOUNTS,
	CONSTANTS,
	RedisConfig,
	corsConfig,
	redisConfig,
} from '@/configs';
import { DomainModule } from '@/domains/domain.module';
import {
	CacheHelperModule,
	PineconeProviderModule,
	PrismaModule,
} from '@/providers';
import { QueueModule } from '@/queue/queue.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [corsConfig, redisConfig],
			cache: true,
			isGlobal: true,
		}),

		BullModule.forRootAsync({
			inject: [redisConfig.KEY],
			useFactory: (config: RedisConfig) => {
				return {
					connection: {
						url: config.url,
					},
				};
			},
		}),

		CacheModule.registerAsync({
			inject: [redisConfig.KEY],
			useFactory: (config: RedisConfig) => {
				return {
					stores: [
						new Keyv({
							store: new CacheableMemory({
								ttl: CONSTANTS.TTL,
								lruSize: CONSTANTS.LRU_SIZE,
							}),
						}),
						createKeyv(config.url),
					],
				};
			},
			isGlobal: true,
		}),

		BullBoardModule.forRootAsync({
			inject: [redisConfig.KEY],
			useFactory: (config: RedisConfig) => {
				return {
					route: `/${CONFIG_MOUNTS.BULL_BOARD}`,
					adapter: ExpressAdapter,
					middleware: basicAuth(config.bullmq.username, config.bullmq.password),
				};
			},
		}),

		CacheHelperModule,
		PineconeProviderModule,
		PrismaModule,
		AuthModule,
		DomainModule,
		QueueModule,
	],
})
export class AppModule {}
