import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class RemoveStudentDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	studentId: string;
}
