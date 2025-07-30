import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';

import {
	AILogMetadata,
	AI_LOG_KEY,
} from '@/ai/interceptors/ai-logging.interceptor';

import { AIAPIType } from '~/generated/prisma';

export const AILog = (
	type: AIAPIType,
	getSemesterId?: (req: Request, result?: any) => Promise<string> | string,
): MethodDecorator => {
	const metadata: AILogMetadata = {
		type,
		getSemesterId,
	};
	return SetMetadata(AI_LOG_KEY, metadata);
};
