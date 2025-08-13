import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateThesisApplicationDto {
	@ApiProperty()
	@IsUUID()
	groupId: string;

	@ApiProperty()
	@IsUUID()
	thesisId: string;
}
