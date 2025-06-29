import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AdminService } from '@/admins/admin.service';
import { UpdateAdminDto } from '@/admins/dto';
import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Admin')
@Controller('admins')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Roles(Role.ADMIN)
	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.adminService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	async update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
		return await this.adminService.update(id, dto);
	}
}
