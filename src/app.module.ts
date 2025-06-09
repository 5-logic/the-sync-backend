import { MiddlewareConsumer, Module } from '@nestjs/common';

import { DomainModule } from '@/domains/domain.module';
import { MorganMiddleware } from '@/middlewares/morgan/morgan.middleware';

@Module({ imports: [DomainModule] })
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(MorganMiddleware).forRoutes('*');
	}
}
