import { ApiProperty } from '@nestjs/swagger';
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	Matches,
	MinLength,
} from 'class-validator';

export class UserLoginDto {
	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@MinLength(12)
	@Matches(/^(?=.*[A-Z])(?=.*\d).+$/)
	password: string;
}
