import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';

import { CreateUserDto } from '@/users/index';

export class ImportStudentItemDto extends CreateUserDto {
	@ApiProperty()
	@IsString()
	studentCode: string;
}

export class ImportStudentDto {
	@ApiProperty()
	@IsUUID()
	semesterId: string;

	@ApiProperty()
	@IsUUID()
	majorId: string;

	@ApiProperty({ type: [ImportStudentItemDto] })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ImportStudentItemDto)
	students: ImportStudentItemDto[];
}
