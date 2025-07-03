import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignSupervisionDto {
	@ApiProperty()
	@IsUUID()
	lecturerId: string;
}
