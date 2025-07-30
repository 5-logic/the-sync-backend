import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { Gender } from '~/generated/prisma';

export class CreateUserDto {
	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	fullName: string;

	@ApiProperty({ enum: Gender, default: Gender.Male })
	@IsEnum(Gender)
	@IsNotEmpty()
	gender: Gender;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	phoneNumber: string;
}
