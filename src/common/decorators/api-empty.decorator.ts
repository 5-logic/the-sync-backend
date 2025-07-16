import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ApiEmptyResponse = (status: number) =>
	applyDecorators(
		ApiResponse({
			status,
		}),
	);
