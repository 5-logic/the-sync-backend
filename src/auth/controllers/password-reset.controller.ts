import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AUTH_API_TAGS, AUTH_CONSTANTS } from '@/auth/constants';
import { PasswordResetDocs } from '@/auth/docs';
import {
	RequestPasswordResetDto,
	VerifyOtpAndResetPasswordDto,
} from '@/auth/dto';
import { PasswordResetService } from '@/auth/services';

@ApiTags(AUTH_API_TAGS)
@Controller(AUTH_CONSTANTS.PASSWORD_RESET)
export class PasswordResetController {
	constructor(private readonly service: PasswordResetService) {}

	@Post('request')
	@ApiOperation(PasswordResetDocs.request)
	async request(@Body() dto: RequestPasswordResetDto) {
		return await this.service.request(dto);
	}

	@Post('verify')
	@ApiOperation(PasswordResetDocs.verify)
	async verify(@Body() dto: VerifyOtpAndResetPasswordDto) {
		return await this.service.verify(dto);
	}
}
