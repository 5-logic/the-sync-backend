import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const res: FastifyReply = context.switchToHttp().getResponse();

		return next.handle().pipe(
			map((data) => ({
				success: true,
				statusCode: res.statusCode,
				data: data,
			})),
		);
	}
}
