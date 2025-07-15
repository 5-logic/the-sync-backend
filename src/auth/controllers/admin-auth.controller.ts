import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AUTH_API_TAGS, AUTH_CONSTANTS } from '@/auth/constants';
import { Roles } from '@/auth/decorators';
import { AdminAuthDocs } from '@/auth/docs';
import { AdminLoginDto, RefreshDto } from '@/auth/dto';
import { Role } from '@/auth/enums';
import { JwtAccessAuthGuard, RoleGuard } from '@/auth/guards';
import { UserPayload } from '@/auth/interfaces';
import { AdminAuthService, BaseAuthService } from '@/auth/services';

@ApiTags(AUTH_API_TAGS)
@Controller(AUTH_CONSTANTS.ADMIN_AUTH)
export class AdminAuthController {
	constructor(
		private readonly adminAuthService: AdminAuthService,
		private readonly baseAuthSerivce: BaseAuthService,
	) {}

	@Post('login')
	@ApiOperation(AdminAuthDocs.login)
	async login(@Body() dto: AdminLoginDto) {
		return await this.adminAuthService.login(dto);
	}

	@Post('refresh')
	@ApiOperation(AdminAuthDocs.refresh)
	async refresh(@Body() dto: RefreshDto) {
		return await this.adminAuthService.refresh(dto);
	}

	@ApiBearerAuth()
	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@Roles(Role.ADMIN)
	@Post('logout')
	@ApiOperation(AdminAuthDocs.logout)
	async logout(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.baseAuthSerivce.logout(user.id);
	}
}
