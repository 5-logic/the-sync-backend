import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class StudentExpectedResponsibilityDto {
	@ApiProperty()
	@IsUUID()
	responsibilityId: string;
}
