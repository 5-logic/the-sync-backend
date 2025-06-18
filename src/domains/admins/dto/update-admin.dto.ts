import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UpdateAdminDto {
	@ApiProperty()
	@IsEmail()
	email: string;
}
