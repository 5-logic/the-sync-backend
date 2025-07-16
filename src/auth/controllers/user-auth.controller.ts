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
import { UserAuthDocs } from '@/auth/docs';
import { RefreshDto, UserLoginDto } from '@/auth/dto';
import { Role } from '@/auth/enums';
import { JwtAccessAuthGuard, RoleGuard } from '@/auth/guards';
import { UserPayload } from '@/auth/interfaces';
import { LoginResponse, RefreshResponse } from '@/auth/responses';
import { BaseAuthService, UserAuthService } from '@/auth/services';
import { ApiBaseResponse, ApiEmptyResponse } from '@/common';

@ApiTags(AUTH_API_TAGS)
@Controller(AUTH_CONSTANTS.USER_AUTH)
export class UserAuthController {
	constructor(
		private readonly userAuthService: UserAuthService,
		private readonly baseAuthService: BaseAuthService,
	) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	@ApiOperation(UserAuthDocs.login)
	@ApiBaseResponse(LoginResponse, HttpStatus.OK)
	async login(@Body() dto: UserLoginDto): Promise<LoginResponse> {
		return await this.userAuthService.login(dto);
	}

	@HttpCode(HttpStatus.OK)
	@Post('refresh')
	@ApiOperation(UserAuthDocs.refresh)
	@ApiBaseResponse(RefreshResponse, HttpStatus.OK)
	async refres(@Body() dto: RefreshDto): Promise<RefreshResponse> {
		return await this.userAuthService.refresh(dto);
	}

	@ApiBearerAuth()
	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@Roles(Role.STUDENT, Role.MODERATOR, Role.LECTURER)
	@HttpCode(HttpStatus.OK)
	@Post('logout')
	@ApiOperation(UserAuthDocs.logout)
	@ApiEmptyResponse(HttpStatus.OK)
	async logout(@Req() req: Request): Promise<void> {
		const user = req.user as UserPayload;

		return await this.baseAuthService.logout(user.id);
	}
}
