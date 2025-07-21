import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString } from 'class-validator';

import { Gender } from '~/generated/prisma';

export class CreateUserDto {
	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty()
	@IsString()
	fullName: string;

	@ApiProperty({ enum: Gender, default: Gender.Male })
	@IsEnum(Gender)
	gender: Gender;

	@ApiProperty()
	@IsString()
	phoneNumber: string;
}
