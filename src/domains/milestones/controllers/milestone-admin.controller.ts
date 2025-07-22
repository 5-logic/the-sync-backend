import {
	Body,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import {
	MILESTONE_API_TAGS,
	MILESTONE_CONSTANTS,
} from '@/milestones/constants';
import { MilestoneAdminDocs } from '@/milestones/docs';
import { CreateMilestoneDto, UpdateMilestoneDto } from '@/milestones/dtos';
import { MilestoneResponse } from '@/milestones/responses';
import { MilestoneAdminService } from '@/milestones/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(MILESTONE_API_TAGS)
@Controller(MILESTONE_CONSTANTS.BASE)
export class MilestoneAdminController {
	constructor(private readonly service: MilestoneAdminService) {}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	@ApiOperation(MilestoneAdminDocs.create)
	async create(@Body() dto: CreateMilestoneDto): Promise<MilestoneResponse> {
		return await this.service.create(dto);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@SwaggerDoc('milestone', 'update')
	async update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
		return await this.service.update(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	@SwaggerDoc('milestone', 'delete')
	async delete(@Param('id') id: string) {
		return await this.service.delete(id);
	}
}
