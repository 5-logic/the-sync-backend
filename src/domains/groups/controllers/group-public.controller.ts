import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { GROUP_API_TAGS, GROUP_CONSTANTS } from '@/groups/constants';
import { GroupPublicService } from '@/groups/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(GROUP_API_TAGS)
@Controller(GROUP_CONSTANTS.BASE)
export class GroupPublicController {
	constructor(private readonly service: GroupPublicService) {}

	@Get()
	async findAll() {
		return await this.service.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.service.findOne(id);
	}

	@Get(':id/members')
	async findGroupMembers(@Param('id') id: string) {
		return await this.service.findGroupMembers(id);
	}

	@Get(':id/skills-responsibilities')
	async findGroupSkillsAndResponsibilities(@Param('id') id: string) {
		return await this.service.findGroupSkillsAndResponsibilities(id);
	}

	@Get('student/:studentId')
	async findByStudentId(@Param('studentId') studentId: string) {
		return await this.service.findDetailedByStudentId(studentId);
	}
}
