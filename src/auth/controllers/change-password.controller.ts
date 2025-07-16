import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AUTH_API_TAGS, AUTH_CONSTANTS } from '@/auth/constants';
import { ChangePasswordDocs } from '@/auth/docs';
import { ChangePasswordDto } from '@/auth/dto';
import { JwtAccessAuthGuard, RoleGuard } from '@/auth/guards';
import { UserPayload } from '@/auth/interfaces';
import { ChangePasswordService } from '@/auth/services';

@ApiTags(AUTH_API_TAGS)
@Controller(AUTH_CONSTANTS.CHANGE_PASSWORD)
export class ChangePasswordController {
	constructor(private readonly service: ChangePasswordService) {}

	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@Put()
	@ApiOperation(ChangePasswordDocs.changePassword)
	async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
		const user = req.user as UserPayload;

		return await this.service.changePassword(user.id, dto);
	}
}
