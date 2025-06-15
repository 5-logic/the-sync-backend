import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

import { CreateUserDto } from '@/users/dto/create-user.dto';

export class CreateStudentDto {
	@ApiProperty({ type: () => CreateUserDto })
	@ValidateNested()
	@Type(() => CreateUserDto)
	createUserDto: CreateUserDto;

	@ApiProperty()
	@IsString()
	studentId: string;

	@ApiProperty()
	@IsString()
	majorId: string;

	@ApiProperty()
	@IsString()
	semesterId: string;
}
