import { ApiProperty } from '@nestjs/swagger';

export class ArrayResponse<T = any> {
	@ApiProperty()
	success: boolean;

	@ApiProperty()
	message: string;

	@ApiProperty({ type: Object, isArray: true })
	data: T[];
}
