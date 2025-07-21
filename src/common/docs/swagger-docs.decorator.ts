import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import type { OperationObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { DOCS_MAP } from '@/common/docs/index';

export function SwaggerDoc<
	M extends keyof typeof DOCS_MAP,
	A extends keyof (typeof DOCS_MAP)[M],
>(module: M, action: A) {
	const doc = DOCS_MAP[module][action] as Partial<OperationObject>;
	return applyDecorators(ApiOperation(doc));
}
