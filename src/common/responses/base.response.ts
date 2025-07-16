import { ApiProperty } from '@nestjs/swagger';

export class BaseResponse<T = any> {
	@ApiProperty()
	success: boolean;

	@ApiProperty()
	message: string;

	@ApiProperty({ type: Object, isArray: false })
	data: T;
}
