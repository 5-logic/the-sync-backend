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
	CHECKLIST_API_TAGS,
	CHECKLIST_CONSTANTS,
} from '@/checklists/constants';
import { ChecklistModeratorDocs } from '@/checklists/docs';
import { CreateChecklistDto, UpdateChecklistDto } from '@/checklists/dtos';
import { ChecklistModeratorService } from '@/checklists/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(CHECKLIST_API_TAGS)
@Controller(CHECKLIST_CONSTANTS.BASE)
export class ChecklistModeratorController {
	constructor(private readonly service: ChecklistModeratorService) {}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	@ApiOperation(ChecklistModeratorDocs.create)
	async create(@Body() createChecklistDto: CreateChecklistDto) {
		return await this.service.create(createChecklistDto);
	}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Put(':id')
	@ApiOperation(ChecklistModeratorDocs.update)
	async update(
		@Param('id') id: string,
		@Body() updateChecklistDto: UpdateChecklistDto,
	) {
		return await this.service.update(id, updateChecklistDto);
	}

	@Roles(Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Delete(':id')
	@ApiOperation(ChecklistModeratorDocs.remove)
	async remove(@Param('id') id: string) {
		return await this.service.remove(id);
	}
}
