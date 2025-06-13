import { MiddlewareConsumer, Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { DomainModule } from '@/domains/domain.module';
import { MorganMiddleware } from '@/middlewares/morgan/morgan.middleware';

@Module({ imports: [AuthModule, DomainModule] })
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(MorganMiddleware).forRoutes('*');
	}
}
