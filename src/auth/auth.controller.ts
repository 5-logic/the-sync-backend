import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from '@/auth/auth.service';
import { AdminLoginDto } from '@/auth/dto/auth.admin.dto';
import { RefreshDto } from '@/auth/dto/auth.refresh.dto';
import { UserLoginDto } from '@/auth/dto/auth.user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('admin/login')
	async loginAdmin(@Body() adminLoginDto: AdminLoginDto) {
		return await this.authService.loginAdmin(adminLoginDto);
	}

	@Post('admin/refresh')
	async refreshAdmin(@Body() refreshDto: RefreshDto) {
		return await this.authService.refreshAdmin(refreshDto);
	}

	@Post('user/login')
	async loginUser(@Body() userLoginDto: UserLoginDto) {
		return await this.authService.loginUser(userLoginDto);
	}

	@Post('user/refresh')
	async refreshUser(@Body() refreshDto: RefreshDto) {
		return await this.authService.refreshUser(refreshDto);
	}
}
