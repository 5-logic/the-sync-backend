import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

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
	async createMany(@Body() dto: CreateManyGroupDto) {
		return await this.service.createMany(dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Put('format/:semesterId')
	@ApiOperation(GroupAdminDocs.formatGroup)
	async formatGroup(@Param('semesterId') semesterId: string) {
		return await this.service.formatGroup(semesterId);
	}
}
