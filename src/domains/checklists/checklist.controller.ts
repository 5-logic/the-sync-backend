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
@ApiTags('Checklists')
@Controller('checklists')
export class ChecklistController {
	constructor(private readonly ChecklistService: ChecklistService) {}

	@Roles(Role.LECTURER)
	@SwaggerDoc('checklists', 'create')
	@Post()
	create(@Body() createChecklistDto: CreateChecklistDto) {
		return this.ChecklistService.create(createChecklistDto);
	}

	@Roles(Role.LECTURER, Role.STUDENT)
	@SwaggerDoc('checklists', 'findAll')
	@Get()
	findAll() {
		return this.ChecklistService.findAll();
	}

	@Roles(Role.LECTURER, Role.STUDENT)
	@SwaggerDoc('checklists', 'findOne')
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.ChecklistService.findOne(id);
	}

	@Roles(Role.LECTURER)
	@SwaggerDoc('checklists', 'update')
	@Put(':id')
	update(
		@Param('id') id: string,
		@Body() updateChecklistDto: UpdateChecklistDto,
	) {
		return this.ChecklistService.update(id, updateChecklistDto);
	}

	@Roles(Role.LECTURER)
	@SwaggerDoc('checklists', 'remove')
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.ChecklistService.remove(id);
	}

	@Roles(Role.LECTURER, Role.STUDENT)
	@SwaggerDoc('checklists', 'findByMilestone')
	@Get('milestone/:milestoneId')
	findByMilestone(@Param('milestoneId') milestoneId: string) {
		return this.ChecklistService.findByMilestone(milestoneId);
	}
}
