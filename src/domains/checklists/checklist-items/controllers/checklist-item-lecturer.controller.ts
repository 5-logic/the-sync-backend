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
	CHECKLIST_ITEM_API_TAGS,
	CHECKLIST_ITEM_CONSTANTS,
} from '@/checklists/checklist-items/constants';
import { ChecklistItemLecturerDocs } from '@/checklists/checklist-items/docs';
import { ChecklistItemLecturerService } from '@/checklists/checklist-items/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(CHECKLIST_ITEM_API_TAGS)
@Controller(CHECKLIST_ITEM_CONSTANTS.BASE)
export class ChecklistItemLecturerController {
	constructor(private readonly service: ChecklistItemLecturerService) {}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(ChecklistItemLecturerDocs.findAll)
	async findAll() {
		return await this.service.findAll();
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(ChecklistItemLecturerDocs.findOne)
	async findOne(@Param('id') id: string) {
		return await this.service.findOne(id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get('checklist/:checklistId')
	@ApiOperation(ChecklistItemLecturerDocs.findByChecklistId)
	async findByChecklistId(@Param('checklistId') checklistId: string) {
		return await this.service.findByChecklistId(checklistId);
	}
}
