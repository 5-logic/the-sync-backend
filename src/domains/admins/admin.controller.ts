import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AdminService } from '@/admins/admin.service';
import { UpdateAdminDto } from '@/admins/dto/update-admin.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt-access.guard';
import { RoleGuard } from '@/auth/guards/role.guard';

@Roles(Role.ADMIN)
@UseGuards(RoleGuard)
@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags('Admin')
@Controller('admins')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.adminService.findOne(id);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateAdminDto: UpdateAdminDto,
	) {
		return await this.adminService.update(id, updateAdminDto);
	}
}
