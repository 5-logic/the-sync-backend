import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AUTH_API_TAGS, AUTH_CONSTANTS } from '@/auth/constants';
import { Roles } from '@/auth/decorators';
import { UserAuthDocs } from '@/auth/docs';
import { RefreshDto, UserLoginDto } from '@/auth/dto';
import { Role } from '@/auth/enums';
import { JwtAccessAuthGuard, RoleGuard } from '@/auth/guards';
import { UserPayload } from '@/auth/interfaces';
import { BaseAuthService, UserAuthService } from '@/auth/services';

@ApiTags(AUTH_API_TAGS)
@Controller(AUTH_CONSTANTS.USER_AUTH)
export class UserAuthController {
	constructor(
		private readonly userAuthService: UserAuthService,
		private readonly baseAuthService: BaseAuthService,
	) {}

	@Post('login')
	@ApiOperation(UserAuthDocs.login)
	async login(@Body() dto: UserLoginDto) {
		return await this.userAuthService.login(dto);
	}

	@Post('refresh')
	@ApiOperation(UserAuthDocs.refresh)
	async refres(@Body() dto: RefreshDto) {
		return await this.userAuthService.refresh(dto);
	}

	@ApiBearerAuth()
	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@Roles(Role.STUDENT, Role.MODERATOR, Role.LECTURER)
	@Post('logout')
	@ApiOperation(UserAuthDocs.logout)
	async logout(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.baseAuthService.logout(user.id);
	}
}
