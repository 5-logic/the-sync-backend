import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '@/app.module';
import { setupSwagger } from '@/swagger/setup';

async function bootstrap() {
	const logger = new ConsoleLogger({
		prefix: 'TheSync',
		timestamp: true,
	});

	const app = await NestFactory.create(AppModule, { logger: logger });

	// Setup Swagger
	setupSwagger(app);

	await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
