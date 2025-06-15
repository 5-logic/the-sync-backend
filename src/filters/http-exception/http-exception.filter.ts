import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		let status: number;
		let errorMessage: string | object;

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();

			if (typeof exceptionResponse === 'string') {
				errorMessage = exceptionResponse;
			} else if (
				typeof exceptionResponse === 'object' &&
				exceptionResponse !== null
			) {
				const responseObj = exceptionResponse as any;
				errorMessage = responseObj.message || responseObj.error || responseObj;
			} else {
				errorMessage = 'An error occurred';
			}
		} else {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
			errorMessage = 'Internal server error';
		}

		const errorResponse = {
			success: false,
			statusCode: status,
			error: errorMessage,
		};

		response.status(status).json(errorResponse);
	}
}
