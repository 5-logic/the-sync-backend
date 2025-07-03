import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateSupervisionDto {
	@ApiProperty()
	@IsString()
	currentLecturerId: string;

	@ApiProperty()
	@IsString()
	newLecturerId: string;
}
