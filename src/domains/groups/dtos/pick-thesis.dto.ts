import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class PickThesisDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	thesisId: string;
}
