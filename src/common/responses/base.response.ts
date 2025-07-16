import { ApiProperty } from '@nestjs/swagger';

export class BaseResponse<T = any> {
	@ApiProperty()
	success: boolean;

	@ApiProperty()
	statusCode: number;

	@ApiProperty({ type: Object, isArray: false })
	data: T;
}
