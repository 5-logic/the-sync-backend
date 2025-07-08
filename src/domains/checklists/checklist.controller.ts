import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { ChecklistService } from '@/checklists/checklist.service';
import { CreateChecklistDto, UpdateChecklistDto } from '@/checklists/dto';
import { SwaggerDoc } from '@/common/docs';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Checklist')
@Controller('checklists')
export class ChecklistController {
	constructor(private readonly ChecklistService: ChecklistService) {}

	@Roles(Role.MODERATOR)
	@SwaggerDoc('checklist', 'create')
	@Post()
	async create(@Body() createChecklistDto: CreateChecklistDto) {
		return await this.ChecklistService.create(createChecklistDto);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@SwaggerDoc('checklist', 'findAll')
	@Get()
	async findAll() {
		return await this.ChecklistService.findAll();
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@SwaggerDoc('checklist', 'findOne')
	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.ChecklistService.findOne(id);
	}

	@Roles(Role.MODERATOR)
	@SwaggerDoc('checklist', 'update')
	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateChecklistDto: UpdateChecklistDto,
	) {
		return await this.ChecklistService.update(id, updateChecklistDto);
	}

	@Roles(Role.MODERATOR)
	@SwaggerDoc('checklist', 'remove')
	@Delete(':id')
	async remove(@Param('id') id: string) {
		return await this.ChecklistService.remove(id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@SwaggerDoc('checklist', 'findByMilestone')
	@Get('milestone/:milestoneId')
	async findByMilestone(@Param('milestoneId') milestoneId: string) {
		return await this.ChecklistService.findByMilestone(milestoneId);
	}
}
