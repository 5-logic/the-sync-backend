import { GroupResponse } from '../responses';
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { ApiArrayResponse } from '@/common';
import { GROUP_API_TAGS, GROUP_CONSTANTS } from '@/groups/constants';
import { GroupPublicDocs } from '@/groups/docs';
import { GroupPublicService } from '@/groups/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(GROUP_API_TAGS)
@Controller(GROUP_CONSTANTS.BASE)
export class GroupPublicController {
	constructor(private readonly service: GroupPublicService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(GroupPublicDocs.findAll)
	@ApiArrayResponse(GroupResponse, HttpStatus.OK)
	async findAll(): Promise<GroupResponse[]> {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(GroupPublicDocs.findOne)
	async findOne(@Param('id') id: string) {
		return await this.service.findOne(id);
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id/members')
	@ApiOperation(GroupPublicDocs.findGroupMembers)
	async findGroupMembers(@Param('id') id: string) {
		return await this.service.findGroupMembers(id);
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id/skills-responsibilities')
	@ApiOperation(GroupPublicDocs.findGroupSkillsAndResponsibilities)
	async findGroupSkillsAndResponsibilities(@Param('id') id: string) {
		return await this.service.findGroupSkillsAndResponsibilities(id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('student/:studentId')
	@ApiOperation(GroupPublicDocs.findByStudentId)
	async findByStudentId(@Param('studentId') studentId: string) {
		return await this.service.findDetailedByStudentId(studentId);
	}
}
