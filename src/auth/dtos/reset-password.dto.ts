import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RequestPasswordResetDto {
	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	email: string;
}

export class VerifyOtpAndResetPasswordDto {
	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@Length(8, 8)
	otpCode: string;
}
