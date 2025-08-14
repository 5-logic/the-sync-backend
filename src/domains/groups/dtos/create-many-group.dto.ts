import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID } from 'class-validator';

export class CreateManyGroupDto {
	@ApiProperty()
	@IsUUID()
	semesterId: string;

	@ApiProperty()
	@IsNumber()
	numberOfGroup: number;
}
