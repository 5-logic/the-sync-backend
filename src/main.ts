import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '@/app.module';
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
	const corsConfig = configService.get('cors-config');
	const isProduction = configService.get('NODE_ENV') == 'production' || false;

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
	logger.log(`OpenAPI documentation is available at /swagger`, 'Bootstrap');
}

void bootstrap();
