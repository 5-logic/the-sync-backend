import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangeSupervisionDto {
	@ApiProperty()
	@IsString()
	currentLecturerId: string;

	@ApiProperty()
	@IsString()
	newLecturerId: string;
}
