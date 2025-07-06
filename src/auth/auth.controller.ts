import { Body, Controller, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('admin/login')
	@ApiOperation({
		summary: 'Admin login',
		description: 'Authenticate admin with username and password.',
	})
	async loginAdmin(@Body() dto: AdminLoginDto) {
		return await this.authService.loginAdmin(dto);
	}

	@Post('admin/refresh')
	@ApiOperation({
		summary: 'Refresh admin token',
		description: 'Generate new access token using refresh token.',
	})
	async refreshAdmin(@Body() dto: RefreshDto) {
		return await this.authService.refreshAdmin(dto);
	}

	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@ApiBearerAuth()
	@Roles(Role.ADMIN)
	@Post('admin/logout')
	@ApiOperation({
		summary: 'Admin logout',
		description: 'Logout admin and invalidate tokens.',
	})
	async logoutAdmin(@Req() req: Request) {
		const user = req.user as UserPayload;
		return await this.authService.logoutAdmin(user.id);
	}

	@Post('user/login')
	@ApiOperation({
		summary: 'User login',
		description: 'Authenticate user with email and password.',
	})
	async loginUser(@Body() dto: UserLoginDto) {
		return await this.authService.loginUser(dto);
	}

	@Post('user/refresh')
	@ApiOperation({
		summary: 'Refresh user token',
		description: 'Generate new access token using refresh token.',
	})
	async refreshUser(@Body() dto: RefreshDto) {
		return await this.authService.refreshUser(dto);
	}

	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@ApiBearerAuth()
	@Roles(Role.STUDENT, Role.MODERATOR, Role.LECTURER)
	@Post('user/logout')
	@ApiOperation({
		summary: 'User logout',
		description: 'Logout user and invalidate tokens.',
	})
	async logoutUser(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.authService.logoutUser(user.id);
	}

	@Post('password-reset/request')
	@ApiOperation({
		summary: 'Request password reset',
		description: 'Send OTP to user email for password reset.',
	})
	async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
		return await this.authService.requestPasswordReset(dto);
	}

	@Post('password-reset/verify')
	@ApiOperation({
		summary: 'Verify OTP and reset password',
		description: 'Verify OTP code and generate new password.',
	})
	async verifyOtpAndResetPassword(@Body() dto: VerifyOtpAndResetPasswordDto) {
		return await this.authService.verifyOtpAndResetPassword(dto);
	}

	@UseGuards(JwtAccessAuthGuard, RoleGuard)
	@ApiBearerAuth()
	@Roles(Role.STUDENT, Role.LECTURER, Role.MODERATOR)
	@Put('change-password')
	@ApiOperation({
		summary: 'Change password',
		description: 'Change user password with current password verification.',
	})
	async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
		const user = req.user as UserPayload;

		return await this.authService.changePassword(user.id, dto);
	}
}
