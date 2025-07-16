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

import { ADMIN_API_TAGS, ADMIN_CONSTANTS } from '@/admins/constants';
import { AdminDocs } from '@/admins/docs';
import { UpdateAdminDto } from '@/admins/dto';
import { AdminService } from '@/admins/services';
import {
	JwtAccessAuthGuard,
	Role,
	RoleGuard,
	Roles,
	UserPayload,
} from '@/auth';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(ADMIN_API_TAGS)
@Controller(ADMIN_CONSTANTS.BASE)
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Roles(Role.ADMIN)
	@Get(':id')
	@ApiOperation(AdminDocs.findOne)
	async findOne(@Param('id') id: string) {
		return await this.adminService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put()
	@ApiOperation(AdminDocs.update)
	async update(@Req() req: Request, @Body() dto: UpdateAdminDto) {
		const user = req.user as UserPayload;

		return await this.adminService.update(user.id, dto);
	}
}
