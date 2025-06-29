import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

import { CreateUserDto } from '@/users/dto/create-user.dto';

export class CreateStudentDto extends CreateUserDto {
	@ApiProperty()
	@IsString()
	studentCode: string;

	@ApiProperty()
	@IsUUID()
	majorId: string;

	@ApiProperty()
	@IsUUID()
	semesterId: string;
}
