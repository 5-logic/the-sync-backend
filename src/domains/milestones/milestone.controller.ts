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
		description: 'Create a new milestone for thesis tracking.',
	})
	async create(@Body() dto: CreateMilestoneDto) {
		return await this.milestoneService.create(dto);
	}

	@Get()
	@ApiOperation({
		summary: 'Get all milestones',
		description: 'Retrieve all milestones in the system.',
	})
	async findAll() {
		return await this.milestoneService.findAll();
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get milestone by ID',
		description: 'Retrieve specific milestone details by ID.',
	})
	async findOne(@Param('id') id: string) {
		return await this.milestoneService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@ApiOperation({
		summary: 'Update milestone',
		description: 'Update existing milestone information.',
	})
	async update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
		return await this.milestoneService.update(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	@ApiOperation({
		summary: 'Delete milestone',
		description: 'Delete milestone if not used in any thesis.',
	})
	async delete(@Param('id') id: string) {
		return await this.milestoneService.delete(id);
	}
}
