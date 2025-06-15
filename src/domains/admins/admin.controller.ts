import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AdminService } from '@/admins/admin.service';
import { UpdateAdminDto } from '@/admins/dto/update-admin.dto';

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
