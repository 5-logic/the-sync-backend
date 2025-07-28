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
import {
	CHECKLIST_ITEM_API_TAGS,
	CHECKLIST_ITEM_CONSTANTS,
} from '@/checklists/checklist-items/constants';
import { ChecklistItemModeratorDocs } from '@/checklists/checklist-items/docs';
import {
	CreateManyChecklistItemsDto,
	UpdateManyChecklistItemsDto,
} from '@/checklists/checklist-items/dtos';
import { ChecklistItemModeratorService } from '@/checklists/checklist-items/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(CHECKLIST_ITEM_API_TAGS)
@Controller(CHECKLIST_ITEM_CONSTANTS.BASE)
export class ChecklistItemModeratorController {
	constructor(private readonly service: ChecklistItemModeratorService) {}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.CREATED)
	@Post('create-list')
	@ApiOperation(ChecklistItemModeratorDocs.createMany)
	async createMany(
		@Body() createManyChecklistItemDto: CreateManyChecklistItemsDto,
	) {
		return await this.service.createMany(createManyChecklistItemDto);
	}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Put('checklist/:checklistId/update-list')
	@ApiOperation(ChecklistItemModeratorDocs.updateMany)
	async updateMany(
		@Param('checklistId') checklistId: string,
		@Body() updateManyChecklistItemDto: UpdateManyChecklistItemsDto,
	) {
		return await this.service.updateMany(
			checklistId,
			updateManyChecklistItemDto,
		);
	}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Delete(':id')
	@ApiOperation(ChecklistItemModeratorDocs.remove)
	async remove(@Param('id') id: string) {
		return await this.service.remove(id);
	}
}
