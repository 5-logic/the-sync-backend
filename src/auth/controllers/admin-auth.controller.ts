import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AUTH_API_TAGS, AUTH_CONSTANTS } from '@/auth/constants';
import { Roles } from '@/auth/decorators';
import { AdminAuthDocs } from '@/auth/docs';
import { AdminLoginDto, RefreshDto } from '@/auth/dto';
import { Role } from '@/auth/enums';
import { JwtAccessAuthGuard, RoleGuard } from '@/auth/guards';
import { UserPayload } from '@/auth/interfaces';
import { LoginResponse, RefreshResponse } from '@/auth/responses';
import { AdminAuthService, BaseAuthService } from '@/auth/services';
import { ApiBaseResponse, ApiEmptyResponse } from '@/common';

@ApiTags(AUTH_API_TAGS)
@Controller(AUTH_CONSTANTS.ADMIN_AUTH)
export class AdminAuthController {
	constructor(
		private readonly adminAuthService: AdminAuthService,
		private readonly baseAuthSerivce: BaseAuthService,
	) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	@ApiOperation(AdminAuthDocs.login)
	@ApiBaseResponse(LoginResponse, HttpStatus.OK)
	async login(@Body() dto: AdminLoginDto): Promise<LoginResponse> {
		return await this.adminAuthService.login(dto);
	}

	@HttpCode(HttpStatus.OK)
	@Post('refresh')
	@ApiOperation(AdminAuthDocs.refresh)
	@ApiBaseResponse(RefreshResponse, HttpStatus.OK)
	async refresh(@Body() dto: RefreshDto): Promise<RefreshResponse> {
		return await this.adminAuthService.refresh(dto);
	}

	@ApiBearerAuth()
	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('logout')
	@ApiOperation(AdminAuthDocs.logout)
	@ApiEmptyResponse(HttpStatus.NO_CONTENT)
	async logout(@Req() req: Request): Promise<void> {
		const user = req.user as UserPayload;

		return await this.baseAuthSerivce.logout(user.id);
	}
}
