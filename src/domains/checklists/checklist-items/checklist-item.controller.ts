import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { ChecklistItemService } from '@/checklists/checklist-items/checklist-item.service';
import {
	CreateManyChecklistItemsDto,
	UpdateChecklistItemDto,
} from '@/checklists/checklist-items/dto';
import { SwaggerDoc } from '@/common/docs';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Checklist Item')
@Controller('checklist-items')
export class ChecklistItemController {
	constructor(private readonly checklistItemService: ChecklistItemService) {}

	@Roles(Role.MODERATOR)
	@SwaggerDoc('checklistItem', 'createMany')
	@Post()
	createMany(@Body() createManyChecklistItemsDto: CreateManyChecklistItemsDto) {
		return this.checklistItemService.createMany(createManyChecklistItemsDto);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@SwaggerDoc('checklistItem', 'findAll')
	@Get()
	@ApiQuery({
		name: 'checklistId',
		required: false,
		description: 'Filter by checklist ID',
	})
	findAll(@Query('checklistId') checklistId?: string) {
		return this.checklistItemService.findAll(checklistId);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@SwaggerDoc('checklistItem', 'findOne')
	@Get(':id')
	@ApiParam({
		name: 'id',
		description: 'Checklist item ID',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	findOne(@Param('id') id: string) {
		return this.checklistItemService.findOne(id);
	}

	@Roles(Role.MODERATOR)
	@SwaggerDoc('checklistItem', 'update')
	@Put(':id')
	@ApiParam({
		name: 'id',
		description: 'Checklist item ID',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	update(
		@Param('id') id: string,
		@Body() updateChecklistItemDto: UpdateChecklistItemDto,
	) {
		return this.checklistItemService.update(id, updateChecklistItemDto);
	}

	@Roles(Role.MODERATOR)
	@SwaggerDoc('checklistItem', 'remove')
	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiParam({
		name: 'id',
		description: 'Checklist item ID',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	remove(@Param('id') id: string) {
		return this.checklistItemService.remove(id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@SwaggerDoc('checklistItem', 'findByChecklistId')
	@Get('checklist/:checklistId')
	@ApiParam({
		name: 'checklistId',
		description: 'Checklist ID',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	findByChecklistId(@Param('checklistId') checklistId: string) {
		return this.checklistItemService.findByChecklistId(checklistId);
	}
}
