import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AUTH_API_TAGS, AUTH_CONSTANTS } from '@/auth/constants';
import { PasswordResetDocs } from '@/auth/docs';
import { PasswordResetService } from '@/auth/services';
import { ApiEmptyResponse } from '@/common';

import {
	RequestPasswordResetDto,
	VerifyOtpAndResetPasswordDto,
} from '~/src/auth/dtos';

@ApiTags(AUTH_API_TAGS)
@Controller(AUTH_CONSTANTS.PASSWORD_RESET)
export class PasswordResetController {
	constructor(private readonly service: PasswordResetService) {}

	@HttpCode(HttpStatus.OK)
	@Post('request')
	@ApiOperation(PasswordResetDocs.request)
	@ApiEmptyResponse(HttpStatus.OK)
	async request(@Body() dto: RequestPasswordResetDto): Promise<void> {
		return await this.service.request(dto);
	}

	@HttpCode(HttpStatus.OK)
	@Post('verify')
	@ApiOperation(PasswordResetDocs.verify)
	@ApiEmptyResponse(HttpStatus.OK)
	async verify(@Body() dto: VerifyOtpAndResetPasswordDto): Promise<void> {
		return await this.service.verify(dto);
	}
}
