import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { ADMIN_API_TAGS, ADMIN_CONSTANTS } from '@/admins/constants';
import { AdminDocs } from '@/admins/docs';
import { UpdateAdminDto } from '@/admins/dto';
import { AdminResponse } from '@/admins/responses';
import { AdminService } from '@/admins/services';
import {
	JwtAccessAuthGuard,
	Role,
	RoleGuard,
	Roles,
	UserPayload,
} from '@/auth';
import { ApiBaseResponse } from '@/common';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(ADMIN_API_TAGS)
@Controller(ADMIN_CONSTANTS.BASE)
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(AdminDocs.findOne)
	@ApiBaseResponse(AdminResponse, HttpStatus.OK)
	async findOne(@Req() req: Request): Promise<AdminResponse> {
		const user = req.user as UserPayload;

		return await this.adminService.findOne(user.id);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Put()
	@ApiOperation(AdminDocs.update)
	@ApiBaseResponse(AdminResponse, HttpStatus.OK)
	async update(
		@Req() req: Request,
		@Body() dto: UpdateAdminDto,
	): Promise<AdminResponse> {
		const user = req.user as UserPayload;

		return await this.adminService.update(user.id, dto);
	}
}
