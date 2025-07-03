import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateJoinRequestDto {
	@ApiProperty()
	@IsUUID()
	groupId: string;
}
