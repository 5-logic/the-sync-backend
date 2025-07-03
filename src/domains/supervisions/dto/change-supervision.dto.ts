import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChangeSupervisionDto {
	@ApiProperty()
	@IsUUID()
	currentLecturerId: string;

	@ApiProperty()
	@IsUUID()
	newLecturerId: string;
}
