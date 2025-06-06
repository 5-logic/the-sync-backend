import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import { CreateUserDto } from '@/users/dto/create-user.dto';

export class CreateStudentDto {
	@ApiProperty({ type: () => CreateUserDto })
	@ValidateNested()
	@Type(() => CreateUserDto)
	createUserDto: CreateUserDto;

	@ApiProperty()
	@IsString()
	studentId: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	roles?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	skills?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	academicInterests?: string;

	@ApiProperty()
	@IsString()
	majorId: string;
}
