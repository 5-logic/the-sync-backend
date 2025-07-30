import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsNotEmpty,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator';

import { CreateUserDto } from '@/users/index';

export class ImportStudentItemDto extends CreateUserDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	studentCode: string;
}

export class ImportStudentDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	semesterId: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	majorId: string;

	@ApiProperty({ type: [ImportStudentItemDto] })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ImportStudentItemDto)
	students: ImportStudentItemDto[];
}
