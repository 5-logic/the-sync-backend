import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { BaseResponse } from '@/common/responses';

export const ApiBaseResponse = <TModel extends Type<unknown>>(
	model: TModel,
	status: number,
	description: string,
) =>
	applyDecorators(
		ApiExtraModels(BaseResponse, model),
		ApiResponse({
			status,
			description,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(BaseResponse) },
					{
						properties: {
							data: { $ref: getSchemaPath(model) },
						},
					},
				],
			},
		}),
	);
