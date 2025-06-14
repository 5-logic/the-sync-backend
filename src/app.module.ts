import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '@/auth/auth.module';
import { DomainModule } from '@/domains/domain.module';
import { MorganMiddleware } from '@/middlewares/morgan/morgan.middleware';

@Module({
	imports: [
		ConfigModule.forRoot({ cache: true, isGlobal: true }),
		AuthModule,
		DomainModule,
	],
})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(MorganMiddleware).forRoutes('*');
	}
}
