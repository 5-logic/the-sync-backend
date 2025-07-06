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
import { CreateMilestoneDto, UpdateMilestoneDto } from '@/milestones/dto';
import { MilestoneService } from '@/milestones/milestone.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Milestone')
@Controller('milestones')
export class MilestoneController {
	constructor(private readonly milestoneService: MilestoneService) {}

	@Roles(Role.ADMIN)
	@Post()
	@ApiOperation({
		summary: 'Create milestone',
		description:
			'Create a new milestone for thesis tracking within a semester. Only available during ongoing semesters. Validates date ranges, prevents overlapping milestones, and ensures start date is not in the past. Milestones help track thesis progress throughout the semester.',
	})
	async create(@Body() dto: CreateMilestoneDto) {
		return await this.milestoneService.create(dto);
	}

	@Get()
	@ApiOperation({
		summary: 'Get all milestones',
		description:
			'Retrieve all milestones in the system across all semesters. Returns a comprehensive list of thesis tracking milestones with their details including name, date ranges, and associated semester information. Results are ordered by creation date (newest first).',
	})
	async findAll() {
		return await this.milestoneService.findAll();
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get milestone by ID',
		description:
			'Retrieve detailed information about a specific milestone by its unique identifier. Returns complete milestone data including name, start/end dates, creation timestamps, and associated semester. Useful for viewing milestone details or preparing for updates.',
	})
	async findOne(@Param('id') id: string) {
		return await this.milestoneService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@ApiOperation({
		summary: 'Update milestone',
		description:
			'Update existing milestone information including name and date ranges. Only allowed for ongoing semesters and before the milestone start date. Validates new date ranges, prevents overlapping with other milestones, and ensures business rules are maintained. Cannot modify milestones that have already started.',
	})
	async update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
		return await this.milestoneService.update(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	@ApiOperation({
		summary: 'Delete milestone',
		description:
			'Permanently delete a milestone from the system. Only allowed for ongoing semesters and before the milestone start date. Ensures the milestone is not in use by any thesis tracking activities. Cannot delete milestones that have already started or are linked to thesis progress.',
	})
	async delete(@Param('id') id: string) {
		return await this.milestoneService.delete(id);
	}
}
