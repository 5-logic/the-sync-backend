import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponse {
	@ApiProperty()
	accessToken: string;
}
