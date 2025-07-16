import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse } from '@nestjs/swagger';

import { EmptyResponse } from '@/common/responses';

export const ApiEmptyResponse = (status: number) =>
	applyDecorators(
		ApiExtraModels(EmptyResponse),
		ApiResponse({
			status,
		}),
	);
