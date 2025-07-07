import {
	Body,
	Controller,
	Get,
	Param,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Admin')
@Controller('admins')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Roles(Role.ADMIN)
	@Get(':id')
	@SwaggerDoc('admin', 'findOne')
	async findOne(@Param('id') id: string) {
		return await this.adminService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put()
	@SwaggerDoc('admin', 'update')
	async update(@Req() req: Request, @Body() dto: UpdateAdminDto) {
		const user = req.user as UserPayload;

		return await this.adminService.update(user.id, dto);
	}
}
