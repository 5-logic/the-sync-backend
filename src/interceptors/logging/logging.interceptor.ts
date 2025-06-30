import {
	CallHandler,
	ExecutionContext,
	Injectable,
	Logger,
	NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const req: Request = context.switchToHttp().getRequest();
		const { method, url } = req;

		this.logger.log(`Incoming Request: ${method} ${url}`);

		return next.handle().pipe(
			tap(() => {
				const res: Response = context.switchToHttp().getResponse();
				const { statusCode } = res;

				this.logger.log(`Response Status: ${statusCode} for ${method} ${url}`);
			}),
		);
	}
}
