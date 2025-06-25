import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';

import { AppModule } from '@/app.module';
import { CONFIG_MOUNTS, CONFIG_TOKENS, CORSConfig } from '@/configs';
import { HttpExceptionFilter } from '@/filters/http-exception/http-exception.filter';
import { TransformInterceptor } from '@/interceptors/transform/transform.interceptor';
import { setupSwagger } from '@/swagger/setup';

async function bootstrap() {
	const logger = new ConsoleLogger({
		prefix: 'TheSync',
		timestamp: true,
	});

	const app = await NestFactory.create(AppModule, { logger: logger });
	const configService = app.get<ConfigService>(ConfigService);
	const corsConfig = configService.get<CORSConfig>(CONFIG_TOKENS.CORS);
	const isProduction =
		configService.get<string>('NODE_ENV') === 'production' || false;

	// Increase body size limit for large imports (50MB)
	app.use(json({ limit: '50mb' }));
	app.use(urlencoded({ extended: true, limit: '50mb' }));

	// Enable CORS
	app.enableCors(isProduction ? corsConfig : { origin: '*' });

	// Enable validation globally
	app.useGlobalPipes(new ValidationPipe());

	// Enable global exception filters
	app.useGlobalFilters(new HttpExceptionFilter());

	// Enable global interceptors
	app.useGlobalInterceptors(new TransformInterceptor());

	// Setup Swagger
	setupSwagger(app);

	const port = process.env.PORT ?? 4000;
	await app.listen(port);

	logger.log(`TheSync is running on port ${port}`, 'Bootstrap');
	logger.log(
		`OpenAPI documentation is available at /${CONFIG_MOUNTS.SWAGGER}`,
		'Bootstrap',
	);
}

void bootstrap();
