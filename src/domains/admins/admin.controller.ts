import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AdminService } from '@/admins/admin.service';
import { CreateAdminDto } from '@/admins/dto/create-admin.dto';
import { UpdateAdminDto } from '@/admins/dto/update-admin.dto';

@ApiTags('Admin')
@Controller('admins')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Post()
	async create(@Body() createAdminDto: CreateAdminDto) {
		return await this.adminService.create(createAdminDto);
	}

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
