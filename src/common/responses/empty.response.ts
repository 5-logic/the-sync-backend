import { ApiProperty } from '@nestjs/swagger';

export class EmptyResponse {
	@ApiProperty()
	success: boolean;

	@ApiProperty()
	statusCode: number;
}
