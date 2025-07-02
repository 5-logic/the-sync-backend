import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignSupervisionDto {
	@ApiProperty()
	@IsString()
	lecturerId: string;
}
