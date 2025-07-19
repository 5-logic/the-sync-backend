import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ChangeLeaderDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	newLeaderId: string;
}
