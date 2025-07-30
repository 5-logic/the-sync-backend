import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import {
	CHECKLIST_API_TAGS,
	CHECKLIST_CONSTANTS,
} from '@/checklists/constants';
import { ChecklistLecturerDocs } from '@/checklists/docs';
import { ChecklistLecturerService } from '@/checklists/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(CHECKLIST_API_TAGS)
@Controller(CHECKLIST_CONSTANTS.BASE)
export class ChecklistLecturerController {
	constructor(private readonly service: ChecklistLecturerService) {}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(ChecklistLecturerDocs.findAll)
	async findAll() {
		return await this.service.findAll();
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(ChecklistLecturerDocs.findOne)
	async findOne(@Param('id') id: string) {
		return await this.service.findOne(id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get('milestone/:milestoneId')
	@ApiOperation(ChecklistLecturerDocs.findByMilestone)
	async findByMilestone(@Param('milestoneId') milestoneId: string) {
		return await this.service.findByMilestone(milestoneId);
	}
}
