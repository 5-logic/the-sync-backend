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
import { ApiBaseResponse } from '@/common';
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
	@ApiBaseResponse(MilestoneResponse, HttpStatus.OK)
	async create(@Body() dto: CreateMilestoneDto): Promise<MilestoneResponse> {
		return await this.service.create(dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Put(':id')
	@ApiOperation(MilestoneAdminDocs.update)
	@ApiBaseResponse(MilestoneResponse, HttpStatus.OK)
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateMilestoneDto,
	): Promise<MilestoneResponse> {
		return await this.service.update(id, dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Delete(':id')
	@ApiOperation(MilestoneAdminDocs.delete)
	@ApiBaseResponse(MilestoneResponse, HttpStatus.OK)
	async delete(@Param('id') id: string): Promise<MilestoneResponse> {
		return await this.service.delete(id);
	}
}
