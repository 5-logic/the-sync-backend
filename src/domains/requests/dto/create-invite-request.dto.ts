import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateInviteRequestDto {
	@ApiProperty()
	@IsUUID()
	studentId: string;
}
