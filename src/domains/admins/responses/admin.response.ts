import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	username: string;

	@ApiPropertyOptional()
	email?: string;

	@ApiProperty()
	createdAt: string;

	@ApiProperty()
	updatedAt: string;
}
