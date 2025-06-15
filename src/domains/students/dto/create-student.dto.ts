import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { CreateUserDto } from '@/users/dto/create-user.dto';

export class CreateStudentDto extends CreateUserDto {
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
