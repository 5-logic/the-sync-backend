import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AIStatisticsService } from '@/ai/services';
import { UserPayload } from '@/auth/interfaces';

import { AIAPIType } from '~/generated/prisma';

export const AI_LOG_KEY = 'ai_log';

export interface AILogMetadata {
	type: AIAPIType;
	getSemesterId?: (req: Request, result?: any) => Promise<string> | string;
}

@Injectable()
export class AILoggingInterceptor implements NestInterceptor {
	constructor(
		private readonly reflector: Reflector,
		private readonly aiStatisticsService: AIStatisticsService,
	) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const aiLogMetadata = this.reflector.get<AILogMetadata>(
			AI_LOG_KEY,
			context.getHandler(),
		);

		if (!aiLogMetadata) {
			return next.handle();
		}

		const request = context.switchToHttp().getRequest<Request>();
		const user = request.user as UserPayload;

		return next.handle().pipe(
			tap((result) => {
				// Don't await here, just fire and forget
				this.logAICall(aiLogMetadata, request, user, result).catch((error) => {
					console.error('Failed to log AI API call:', error);
				});
			}),
		);
	}

	private async logAICall(
		aiLogMetadata: AILogMetadata,
		request: Request,
		user: UserPayload,
		result?: any,
	): Promise<void> {
		let semesterId: string;

		if (aiLogMetadata.getSemesterId) {
			semesterId = await aiLogMetadata.getSemesterId(request, result);
		} else {
			// Default: try to get from request body
			semesterId = request.body?.semesterId;
		}

		if (semesterId && user?.id) {
			await this.aiStatisticsService.logAIAPICall(
				user.id,
				semesterId,
				aiLogMetadata.type,
			);
		}
	}
}
