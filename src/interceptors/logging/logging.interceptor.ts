import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private logger = new Logger(LoggingInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const req: FastifyRequest = context.switchToHttp().getRequest();
		const { method, url } = req;

		this.logger.log(`Incoming Request: ${method} ${url}`);

		return next.handle().pipe(
			tap(() => {
				const res: FastifyReply = context.switchToHttp().getResponse();
				const { statusCode } = res;

				this.logger.log(`Response Status: ${statusCode} for ${method} ${url}`);
			}),
		);
	}
}
