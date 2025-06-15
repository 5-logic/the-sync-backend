import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
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
