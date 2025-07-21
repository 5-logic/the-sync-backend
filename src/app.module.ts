import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import basicAuth from 'basic-auth-connect';

import { AuthModule } from '@/auth/auth.module';
import {
	CONFIG_MOUNTS,
	corsConfig,
	pineconeConfig,
	redisConfig,
} from '@/configs';
import { DomainModule } from '@/domains/domain.module';
import {
	CacheHelperModule,
	PineconeProviderModule,
	PrismaModule,
} from '@/providers';
import { QueueModule } from '@/queue/queue.module';
import {
	createCacheStores,
	getBullBoardAuthOrThrow,
	getRedisConfigOrThrow,
} from '@/utils';

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [corsConfig, pineconeConfig, redisConfig],
			cache: true,
			isGlobal: true,
		}),

		BullModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const config = getRedisConfigOrThrow(configService);
				return {
					connection: {
						url: config.url,
					},
				};
			},
		}),

		CacheModule.registerAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const config = getRedisConfigOrThrow(configService);
				return {
					stores: createCacheStores(config),
				};
			},
			isGlobal: true,
		}),

		BullBoardModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const config = getRedisConfigOrThrow(configService);
				const { username, password } = getBullBoardAuthOrThrow(config);
				return {
					route: `/${CONFIG_MOUNTS.BULL_BOARD}`,
					adapter: ExpressAdapter,
					middleware: basicAuth(username, password),
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
