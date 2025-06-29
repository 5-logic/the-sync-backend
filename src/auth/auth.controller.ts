import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from '@/auth/auth.service';
import { AdminLoginDto, RefreshDto, UserLoginDto } from '@/auth/dto';

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

	@Post('user/login')
	async loginUser(@Body() dto: UserLoginDto) {
		return await this.authService.loginUser(dto);
	}

	@Post('user/refresh')
	async refreshUser(@Body() dto: RefreshDto) {
		return await this.authService.refreshUser(dto);
	}
}
