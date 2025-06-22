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

import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt-access.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { CreateMilestoneDto } from '@/milestones/dto/create-milestone.dto';
import { UpdateMilestoneDto } from '@/milestones/dto/update-milestone.dto';
import { MilestoneService } from '@/milestones/milestone.service';

@UseGuards(RoleGuard)
@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags('Milestone')
@Controller('milestones')
export class MilestoneController {
	constructor(private readonly milestoneService: MilestoneService) {}

	@Roles(Role.ADMIN)
	@Post()
	async create(@Body() createMilestoneDto: CreateMilestoneDto) {
		return await this.milestoneService.create(createMilestoneDto);
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
	async update(
		@Param('id') id: string,
		@Body() updateMilestoneDto: UpdateMilestoneDto,
	) {
		return await this.milestoneService.update(id, updateMilestoneDto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	async delete(@Param('id') id: string) {
		return await this.milestoneService.delete(id);
	}
}
