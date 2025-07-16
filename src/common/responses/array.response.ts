import { ApiProperty } from '@nestjs/swagger';

export class ArrayResponse<T = any> {
	@ApiProperty()
	success: boolean;

	@ApiProperty()
	statusCode: number;

	@ApiProperty({ type: Object, isArray: true })
	data: T[];
}
