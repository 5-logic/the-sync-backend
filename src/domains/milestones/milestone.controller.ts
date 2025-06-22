import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateMilestoneDto } from '@/milestones/dto/create-milestone.dto';
import { UpdateMilestoneDto } from '@/milestones/dto/update-milestone.dto';
import { MilestoneService } from '@/milestones/milestone.service';

@ApiTags('Milestone')
@Controller('milestones')
export class MilestoneController {
	constructor(private readonly milestoneService: MilestoneService) {}

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

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateMilestoneDto: UpdateMilestoneDto,
	) {
		return await this.milestoneService.update(id, updateMilestoneDto);
	}

	@Delete(':id')
	async delete(@Param('id') id: string) {
		return await this.milestoneService.delete(id);
	}
}
