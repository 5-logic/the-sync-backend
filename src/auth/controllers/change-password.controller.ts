import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AUTH_API_TAGS, AUTH_CONSTANTS } from '@/auth/constants';
import { Roles } from '@/auth/decorators';
import { ChangePasswordDocs } from '@/auth/docs';
import { Role } from '@/auth/enums';
import { JwtAccessAuthGuard, RoleGuard } from '@/auth/guards';
import { UserPayload } from '@/auth/interfaces';
import { ChangePasswordService } from '@/auth/services';

import { ChangePasswordDto } from '~/src/auth/dtos';

@ApiTags(AUTH_API_TAGS)
@Controller(AUTH_CONSTANTS.CHANGE_PASSWORD)
export class ChangePasswordController {
	constructor(private readonly service: ChangePasswordService) {}

	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@Roles(Role.LECTURER, Role.MODERATOR, Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put()
	@ApiOperation(ChangePasswordDocs.changePassword)
	async changePassword(
		@Req() req: Request,
		@Body() dto: ChangePasswordDto,
	): Promise<void> {
		const user = req.user as UserPayload;

		return await this.service.changePassword(user.id, dto);
	}
}
