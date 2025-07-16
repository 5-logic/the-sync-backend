import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { EmptyResponse } from '@/common/responses';

export const ApiEmptyResponse = <TModel extends Type<unknown>>(
	model: TModel,
	status: number,
) =>
	applyDecorators(
		ApiExtraModels(EmptyResponse, model),
		ApiResponse({
			status,
			schema: {
				$ref: getSchemaPath(EmptyResponse),
			},
		}),
	);
