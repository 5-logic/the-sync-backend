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
	async create(@Body() dto: CreateMilestoneDto) {
		return await this.milestoneService.create(dto);
	}

	@Get()
	async findAll() {
		return await this.milestoneService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.milestoneService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	async update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
		return await this.milestoneService.update(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	async delete(@Param('id') id: string) {
		return await this.milestoneService.delete(id);
	}
}
