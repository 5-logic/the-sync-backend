import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PickThesisDto {
	@ApiProperty({
		description: 'ID of the thesis to be picked by the group',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@IsNotEmpty()
	@IsString()
	thesisId: string;
}
