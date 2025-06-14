import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from '@/auth/auth.service';
import { AdminLoginDto, AdminRefreshDto } from '@/auth/dto/auth.admin.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authSerivce: AuthService) {}

	@Post('admin/login')
	async loginAdmin(@Body() adminLoginDto: AdminLoginDto) {
		return await this.authSerivce.loginAdmin(adminLoginDto);
	}

	@Post('admin/refresh')
	async refreshAdmin(@Body() adminRefreshDto: AdminRefreshDto) {
		return await this.authSerivce.refreshAdmin(adminRefreshDto);
	}
}
