import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from '@/auth/auth.module';
import { CONFIG_TOKENS, RedisConfig, redisConfig } from '@/configs';
import { corsConfig } from '@/configs/cors.config';
import { DomainModule } from '@/domains/domain.module';
import { MorganMiddleware } from '@/middlewares/morgan/morgan.middleware';

@Module({
	imports: [
		BullModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const config = configService.get<RedisConfig>(CONFIG_TOKENS.REDIS);

				if (!config || !config.url) {
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
		AuthModule,
		DomainModule,
	],
})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(MorganMiddleware).forRoutes('*');
	}
}
