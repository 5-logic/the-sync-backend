import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeLeaderDto {
	@ApiProperty({
		description: 'ID of the new leader (must be a member of the group)',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@IsString()
	@IsNotEmpty()
	newLeaderId: string;
}
