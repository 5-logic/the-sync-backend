import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from '@/app.module';
import { CONFIG_MOUNTS, CONFIG_TOKENS, CORSConfig } from '@/configs';
import { HttpExceptionFilter } from '@/filters';
import { LoggingInterceptor, TransformInterceptor } from '@/interceptors';
import { setupSwagger } from '@/swagger/setup';

async function bootstrap() {
	const logger = new ConsoleLogger({
		prefix: 'TheSync',
		timestamp: true,
	});

	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		logger: logger,
	});

	const configService = app.get<ConfigService>(ConfigService);
	const corsConfig = configService.get<CORSConfig>(CONFIG_TOKENS.CORS);

	// Enable CORS
	app.enableCors(corsConfig);

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
