import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignLecturerReviewerDto {
	@ApiProperty()
	@IsArray()
	@IsUUID('4', { each: true })
	lecturerIds: string[];
}
