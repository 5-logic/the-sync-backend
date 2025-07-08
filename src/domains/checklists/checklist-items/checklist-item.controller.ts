import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { ChecklistItemService } from '@/checklists/checklist-items/checklist-item.service';
import {
	CreateManyChecklistItemsDto,
	UpdateManyChecklistItemsDto,
} from '@/checklists/checklist-items/dto';
import { SwaggerDoc } from '@/common/docs';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Checklist Item')
@Controller('checklist-items')
export class ChecklistItemController {
	constructor(private readonly checklistItemService: ChecklistItemService) {}

	@Roles(Role.MODERATOR)
	@ApiBody({ type: CreateManyChecklistItemsDto })
	@SwaggerDoc('checklistItem', 'createMany')
	@Post('create-list')
	async createMany(
		@Body() createManyChecklistItemDto: CreateManyChecklistItemsDto,
	) {
		return await this.checklistItemService.createMany(
			createManyChecklistItemDto,
		);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@SwaggerDoc('checklistItem', 'findAll')
	@Get()
	async findAll(@Query('checklistId') checklistId?: string) {
		return await this.checklistItemService.findAll(checklistId);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@SwaggerDoc('checklistItem', 'findOne')
	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.checklistItemService.findOne(id);
	}

	@Roles(Role.MODERATOR)
	@SwaggerDoc('checklistItem', 'remove')
	@Delete(':id')
	async remove(@Param('id') id: string) {
		return await this.checklistItemService.remove(id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@SwaggerDoc('checklistItem', 'findByChecklistId')
	@Get('checklist/:checklistId')
	async findByChecklistId(@Param('checklistId') checklistId: string) {
		return await this.checklistItemService.findByChecklistId(checklistId);
	}

	@Roles(Role.MODERATOR)
	@ApiBody({ type: UpdateManyChecklistItemsDto })
	@SwaggerDoc('checklistItem', 'updateMany')
	@Put('checklist/:checklistId/update-list')
	async updateMany(
		@Param('checklistId') checklistId: string,
		@Body() updateManyChecklistItemDto: UpdateManyChecklistItemsDto,
	) {
		return await this.checklistItemService.updateMany(
			checklistId,
			updateManyChecklistItemDto,
		);
	}
}
