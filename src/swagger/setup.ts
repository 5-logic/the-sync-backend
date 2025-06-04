import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('../../package.json');

export const setupSwagger = (app: INestApplication<any>) => {
	const config = new DocumentBuilder()
		.setTitle('TheSync Backend API doumentation')
		.setDescription('Backend for TheSync')
		.setVersion(version as string)
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('swagger', app, document, {
		swaggerOptions: {
			tagsSorter: 'alpha',
			operationsSorter: 'method',
			syntaxHighlight: true,
			displayRequestDuration: true,
		},
	});
};
