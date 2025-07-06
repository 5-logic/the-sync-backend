import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class CreateInviteRequestDto {
	@ApiProperty()
	@IsArray()
	@ArrayMinSize(1, { message: 'At least one student ID is required' })
	@ArrayMaxSize(4, { message: 'Maximum 4 students can be invited at once' })
	@IsUUID('4', { each: true, message: 'Each student ID must be a valid UUID' })
	studentIds: string[];
}
