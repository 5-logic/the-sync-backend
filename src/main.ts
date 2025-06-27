import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
	FastifyAdapter,
	NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { FastifyInstance } from 'fastify';

import { AppModule } from '@/app.module';
import {
	BODY_LIMIT,
	CONFIG_MOUNTS,
	CONFIG_TOKENS,
	CORSConfig,
	PRODUCTION,
	RedisConfig,
} from '@/configs';
import { HttpExceptionFilter } from '@/filters';
import { LoggingInterceptor, TransformInterceptor } from '@/interceptors';
import { setupBasicAuthBullBoard } from '@/middlewares';
import { setupSwagger } from '@/swagger/setup';

async function bootstrap() {
	const logger = new ConsoleLogger({
		prefix: 'TheSync',
		timestamp: true,
	});

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({
			bodyLimit: BODY_LIMIT,
		}),
		{ logger: logger },
	);

	const configService = app.get<ConfigService>(ConfigService);
	const corsConfig = configService.get<CORSConfig>(CONFIG_TOKENS.CORS);
	const redisConfig = configService.get<RedisConfig>(CONFIG_TOKENS.REDIS);
	const isProduction = process.env.NODE_ENV === PRODUCTION || false;

	// Get Fastify instance and setup basic auth for BullMQ dashboard
	const fastify = app.getHttpAdapter().getInstance();

	if (redisConfig?.bullmq?.username && redisConfig?.bullmq?.password) {
		setupBasicAuthBullBoard(fastify as FastifyInstance, {
			username: redisConfig.bullmq.username,
			password: redisConfig.bullmq.password,
			protectedRoute: CONFIG_MOUNTS.BULL_BOARD,
			realm: 'BullMQ Dashboard',
		});
	}

	// Enable CORS
	app.enableCors(isProduction ? corsConfig : { origin: '*' });

	// Enable validation globally
	app.useGlobalPipes(new ValidationPipe());

	// Enable global exception filters
	app.useGlobalFilters(new HttpExceptionFilter());

	// Enable global interceptors
	app.useGlobalInterceptors(
		new TransformInterceptor(),
		new LoggingInterceptor(),
	);

	// Setup Swagger
	setupSwagger(app);

	const port = process.env.PORT ?? 4000;
	await app.listen(port);
	logger.log(`TheSync is running on port ${port}`, 'Bootstrap');

	logger.log(
		`OpenAPI documentation is available at /${CONFIG_MOUNTS.SWAGGER}`,
		'Bootstrap',
	);
	logger.log(
		`OpenAPI raw JSON is available at /${CONFIG_MOUNTS.SWAGGER_RAW}`,
		'Bootstrap',
	);

	logger.log(
		`BullMQ Dashboard is available at /${CONFIG_MOUNTS.BULL_BOARD}`,
		'Bootstrap',
	);
}

void bootstrap();
