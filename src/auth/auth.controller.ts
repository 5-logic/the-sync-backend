import { Body, Controller, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from '@/auth/auth.service';
import { Roles } from '@/auth/decorators/roles.decorator';
import {
	AdminLoginDto,
	ChangePasswordDto,
	RefreshDto,
	RequestPasswordResetDto,
	UserLoginDto,
	VerifyOtpAndResetPasswordDto,
} from '@/auth/dto';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard, RoleGuard } from '@/auth/guards';
import { UserPayload } from '@/auth/interfaces';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('admin/login')
	@SwaggerDoc('auth', 'adminLogin')
	async loginAdmin(@Body() dto: AdminLoginDto) {
		return await this.authService.loginAdmin(dto);
	}

	@Post('admin/refresh')
	@SwaggerDoc('auth', 'adminRefresh')
	async refreshAdmin(@Body() dto: RefreshDto) {
		return await this.authService.refreshAdmin(dto);
	}

	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@ApiBearerAuth()
	@Roles(Role.ADMIN)
	@Post('admin/logout')
	@SwaggerDoc('auth', 'adminLogout')
	async logoutAdmin(@Req() req: Request) {
		const user = req.user as UserPayload;
		return await this.authService.logoutAdmin(user.id);
	}

	@Post('user/login')
	@SwaggerDoc('auth', 'userLogin')
	async loginUser(@Body() dto: UserLoginDto) {
		return await this.authService.loginUser(dto);
	}

	@Post('user/refresh')
	@SwaggerDoc('auth', 'userRefresh')
	async refreshUser(@Body() dto: RefreshDto) {
		return await this.authService.refreshUser(dto);
	}

	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@ApiBearerAuth()
	@Roles(Role.STUDENT, Role.MODERATOR, Role.LECTURER)
	@Post('user/logout')
	@SwaggerDoc('auth', 'userLogout')
	async logoutUser(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.authService.logoutUser(user.id);
	}

	@Post('password-reset/request')
	@SwaggerDoc('auth', 'requestPasswordReset')
	async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
		return await this.authService.requestPasswordReset(dto);
	}

	@Post('password-reset/verify')
	@SwaggerDoc('auth', 'verifyOtpAndResetPassword')
	async verifyOtpAndResetPassword(@Body() dto: VerifyOtpAndResetPasswordDto) {
		return await this.authService.verifyOtpAndResetPassword(dto);
	}

	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@ApiBearerAuth()
	@Roles(Role.STUDENT, Role.LECTURER, Role.MODERATOR)
	@Put('change-password')
	@SwaggerDoc('auth', 'changePassword')
	async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
		const user = req.user as UserPayload;

		return await this.authService.changePassword(user.id, dto);
	}
}
