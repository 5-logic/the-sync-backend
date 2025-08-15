import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID } from 'class-validator';

export class StudentResponsibilityDto {
	@ApiProperty()
	@IsUUID()
	responsibilityId: string;

	@ApiProperty()
	@IsNumber()
	level: number;
}
