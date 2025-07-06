import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { ResponsibilityService } from '@/responsibilities/responsibility.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Responsibility')
@Controller('responsibilities')
export class ResponsibilityController {
	constructor(private readonly responsibilityService: ResponsibilityService) {}

	@Get()
	@ApiOperation({
		summary: 'Get all responsibilities',
		description:
			'Retrieve all responsibility definitions available in the system. Responsibilities define the expected roles and duties that group members should fulfill during project work.',
	})
	async findAll() {
		return await this.responsibilityService.findAll();
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get responsibility by ID',
		description:
			'Retrieve detailed information about a specific responsibility by its unique identifier. Returns comprehensive responsibility definition including name and description.',
	})
	async findOne(@Param('id') id: string) {
		return await this.responsibilityService.findOne(id);
	}
}
