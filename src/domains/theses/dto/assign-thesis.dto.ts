import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignThesisDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	groupId: string;
}
