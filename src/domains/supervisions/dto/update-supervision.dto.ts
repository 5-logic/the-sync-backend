import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateSupervisionDto {
	@ApiProperty()
	@IsString()
	oldLecturerId: string;

	@ApiProperty()
	@IsString()
	newLecturerId: string;
}
