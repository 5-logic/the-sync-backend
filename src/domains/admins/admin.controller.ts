import {
	Body,
	Controller,
	Get,
	Param,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AdminService } from '@/admins/admin.service';
import { UpdateAdminDto } from '@/admins/dto';
import {
	JwtAccessAuthGuard,
	Role,
	RoleGuard,
	Roles,
	UserPayload,
} from '@/auth';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Admin')
@Controller('admins')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Roles(Role.ADMIN)
	@Get(':id')
	@ApiOperation({
		summary: 'Get admin by ID',
		description: 'Retrieve admin details by ID. Admin access only.',
	})
	async findOne(@Param('id') id: string) {
		return await this.adminService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put()
	@ApiOperation({
		summary: 'Update admin profile',
		description: 'Update current admin email and password.',
	})
	async update(@Req() req: Request, @Body() dto: UpdateAdminDto) {
		const user = req.user as UserPayload;

		return await this.adminService.update(user.id, dto);
	}
}
