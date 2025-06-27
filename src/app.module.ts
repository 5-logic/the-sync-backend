import { FastifyAdapter } from '@bull-board/fastify';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from '@/auth/auth.module';
import {
	CONFIG_MOUNTS,
	CONFIG_TOKENS,
	RedisConfig,
	redisConfig,
} from '@/configs';
import { corsConfig } from '@/configs/cors.config';
import { DomainModule } from '@/domains/domain.module';
import { PrismaModule } from '@/providers/prisma/prisma.module';
import { QueueModule } from '@/queue/queue.module';

@Module({
	imports: [
		BullModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const config = configService.get<RedisConfig>(CONFIG_TOKENS.REDIS);

				if (!config?.url) {
					throw new Error(
						'Redis configuration is not set. Please check your environment variables or configuration files.',
					);
				}

				return {
					connection: {
						url: config.url,
					},
				};
			},
		}),
		ConfigModule.forRoot({
			load: [corsConfig, redisConfig],
			cache: true,
			isGlobal: true,
		}),
		PrismaModule,
		AuthModule,
		DomainModule,
		QueueModule,
		BullBoardModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const config = configService.get<RedisConfig>(CONFIG_TOKENS.REDIS);

				if (!config?.bullmq?.username || !config?.bullmq?.password) {
					throw new Error(
						'BullMQ configuration is not set. Please check your environment variables or configuration files.',
					);
				}

				return {
					route: `/${CONFIG_MOUNTS.BULL_BOARD}`,
					adapter: FastifyAdapter,
				};
			},
		}),
	],
})
export class AppModule {}
