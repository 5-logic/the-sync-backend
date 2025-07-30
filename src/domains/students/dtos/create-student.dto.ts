import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { CreateUserDto } from '@/users/index';

export class CreateStudentDto extends CreateUserDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	studentCode: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	majorId: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsUUID()
	semesterId: string;
}
