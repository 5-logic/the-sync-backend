import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class AdminLoginDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	username: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@MinLength(12)
	@Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
	password: string;
}
