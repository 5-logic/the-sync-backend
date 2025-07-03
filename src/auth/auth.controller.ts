import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from '@/auth/auth.service';
import { Roles } from '@/auth/decorators/roles.decorator';
import {
	AdminLoginDto,
	RefreshDto,
	RequestPasswordResetDto,
	UserLoginDto,
	VerifyOtpAndResetPasswordDto,
} from '@/auth/dto';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard, RoleGuard } from '@/auth/guards';
import { UserPayload } from '@/auth/interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('admin/login')
	async loginAdmin(@Body() dto: AdminLoginDto) {
		return await this.authService.loginAdmin(dto);
	}

	@Post('admin/refresh')
	async refreshAdmin(@Body() dto: RefreshDto) {
		return await this.authService.refreshAdmin(dto);
	}

	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@ApiBearerAuth()
	@Roles(Role.ADMIN)
	@Post('admin/logout')
	async logoutAdmin(@Req() req: Request) {
		const user = req.user as UserPayload;
		return await this.authService.logoutAdmin(user.id);
	}

	@Post('user/login')
	async loginUser(@Body() dto: UserLoginDto) {
		return await this.authService.loginUser(dto);
	}

	@Post('user/refresh')
	async refreshUser(@Body() dto: RefreshDto) {
		return await this.authService.refreshUser(dto);
	}

	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@ApiBearerAuth()
	@Roles(Role.STUDENT, Role.MODERATOR, Role.LECTURER)
	@Post('user/logout')
	async logoutUser(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.authService.logoutUser(user.id);
	}

	@Post('password-reset/request')
	async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
		return await this.authService.requestPasswordReset(dto);
	}

	@Post('password-reset/verify')
	async verifyOtpAndResetPassword(@Body() dto: VerifyOtpAndResetPasswordDto) {
		return await this.authService.verifyOtpAndResetPassword(dto);
	}
}
