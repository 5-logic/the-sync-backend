import { ApiProperty } from '@nestjs/swagger';

export class RequestResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	type: string;

	@ApiProperty()
	status: string;

	@ApiProperty()
	studentId: string;

	@ApiProperty()
	groupId: string;

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
