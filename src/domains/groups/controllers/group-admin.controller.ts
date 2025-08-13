import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { GROUP_API_TAGS, GROUP_CONSTANTS } from '@/groups/constants';
import { GroupAdminDocs } from '@/groups/docs';
import { CreateManyGroupDto } from '@/groups/dtos';
import { GroupAdminService } from '@/groups/services/group-admin.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(GROUP_API_TAGS)
@Controller(`${GROUP_CONSTANTS.BASE}/admin`)
export class GroupAdminController {
	constructor(private readonly service: GroupAdminService) {}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	@ApiOperation(GroupAdminDocs.createMany)
	async createMany(@Req() req: Request, @Body() dto: CreateManyGroupDto) {
		return await this.service.createMany(dto);
	}

	// @Roles(Role.ADMIN)
	// @HttpCode(HttpStatus.OK)
	// @Put(':id')
	// @ApiOperation(GroupStudentDocs.update)
	// async update(
	// 	@Req() req: Request,
	// 	@Param('id') id: string,
	// 	@Body() dto: UpdateGroupDto,
	// ) {
	// 	const user = req.user as UserPayload;

	// 	return await this.service.update(id, user.id, dto);
	// }

	// @Roles(Role.ADMIN)
	// @HttpCode(HttpStatus.OK)
	// @Delete(':id')
	// @ApiOperation(GroupStudentDocs.delete)
	// async delete(@Req() req: Request, @Param('id') id: string) {
	// 	const user = req.user as UserPayload;

	// 	return await this.service.delete(id, user.id);
	// }
}
