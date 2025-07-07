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
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
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
	@SwaggerDoc('milestone', 'create')
	async create(@Body() dto: CreateMilestoneDto) {
		return await this.milestoneService.create(dto);
	}

	@Get()
	@SwaggerDoc('milestone', 'findAll')
	async findAll() {
		return await this.milestoneService.findAll();
	}

	@Get(':id')
	@SwaggerDoc('milestone', 'findOne')
	async findOne(@Param('id') id: string) {
		return await this.milestoneService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@SwaggerDoc('milestone', 'update')
	async update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
		return await this.milestoneService.update(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	@SwaggerDoc('milestone', 'delete')
	async delete(@Param('id') id: string) {
		return await this.milestoneService.delete(id);
	}
}
