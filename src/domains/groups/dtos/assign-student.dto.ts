import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignStudentDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	studentId: string;
}
