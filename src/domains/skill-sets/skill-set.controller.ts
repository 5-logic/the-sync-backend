import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { SkillSetService } from '@/domains/skill-sets/skill-set.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('SkillSets')
@Controller('skill-sets')
export class SkillSetController {
	constructor(private readonly skillSetsService: SkillSetService) {}

	@Get()
	@ApiOperation({
		summary: 'Get all skill sets',
		description:
			'Retrieve all skill sets available in the system with their associated skills. Each skill set contains a categorized collection of related technical skills. Results include skill details sorted alphabetically for easy navigation.',
	})
	async findAll() {
		return await this.skillSetsService.findAll();
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get skill set by ID',
		description:
			'Retrieve detailed information about a specific skill set including all associated skills. Returns comprehensive skill set data with skill details sorted alphabetically.',
	})
	async findOne(@Param('id') id: string) {
		return await this.skillSetsService.findOne(id);
	}
}
