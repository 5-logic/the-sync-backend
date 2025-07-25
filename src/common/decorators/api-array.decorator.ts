import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ArrayResponse } from '@/common/responses';

export const ApiArrayResponse = <TModel extends Type<unknown>>(
	model: TModel,
	status: number,
) =>
	applyDecorators(
		ApiExtraModels(ArrayResponse, model),
		ApiResponse({
			status,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ArrayResponse) },
					{
						properties: {
							data: {
								type: 'array',
								items: { $ref: getSchemaPath(model) },
							},
						},
					},
				],
			},
		}),
	);
