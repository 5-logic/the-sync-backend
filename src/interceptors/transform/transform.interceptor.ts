import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const response: Response = context.switchToHttp().getResponse();

		return next.handle().pipe(
			map((data) => ({
				success: true,
				statusCode: response.statusCode,
				data: data,
			})),
		);
	}
}
