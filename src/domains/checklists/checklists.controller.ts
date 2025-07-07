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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { ChecklistsService } from '@/checklists/checklists.service';
import { CreateChecklistDto, UpdateChecklistDto } from '@/checklists/dto';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Checklists')
@Controller('checklists')
export class ChecklistsController {
	constructor(private readonly checklistsService: ChecklistsService) {}

	@Roles(Role.LECTURER)
	@ApiOperation({
		summary: 'Create a new checklist',
		description:
			'Creates a new checklist. If milestoneId is provided, validates that the milestone has not started yet.',
	})
	@Post()
	create(@Body() createChecklistDto: CreateChecklistDto) {
		return this.checklistsService.create(createChecklistDto);
	}

	@Roles(Role.LECTURER, Role.STUDENT)
	@ApiOperation({
		summary: 'Get all checklists',
		description:
			'Retrieves all checklists with their associated milestone information and item counts.',
	})
	@Get()
	findAll() {
		return this.checklistsService.findAll();
	}

	@Roles(Role.LECTURER, Role.STUDENT)
	@ApiOperation({
		summary: 'Get a specific checklist by ID',
		description:
			'Retrieves detailed information about a specific checklist including its items and review history.',
	})
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.checklistsService.findOne(id);
	}

	@Roles(Role.LECTURER)
	@ApiOperation({
		summary: 'Update a checklist',
		description:
			'Updates a checklist. If the checklist is attached to a milestone, validates that the milestone has not started yet.',
	})
	@Put(':id')
	update(
		@Param('id') id: string,
		@Body() updateChecklistDto: UpdateChecklistDto,
	) {
		return this.checklistsService.update(id, updateChecklistDto);
	}

	@Roles(Role.LECTURER)
	@ApiOperation({
		summary: 'Delete a checklist',
		description:
			'Deletes a checklist. If attached to a milestone, validates timing. Cannot delete if used in reviews.',
	})
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.checklistsService.remove(id);
	}

	@Roles(Role.LECTURER, Role.STUDENT)
	@ApiOperation({
		summary: 'Get all checklists for a specific milestone',
		description:
			'Retrieves all checklists associated with a specific milestone.',
	})
	@Get('milestone/:milestoneId')
	findByMilestone(@Param('milestoneId') milestoneId: string) {
		return this.checklistsService.findByMilestone(milestoneId);
	}
}
