import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { SkillSetsService } from '@/skill-sets/skill-sets.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('SkillSets')
@Controller('skill-sets')
export class SkillSetsController {
	constructor(private readonly skillSetsService: SkillSetsService) {}

	@Get()
	async findAll() {
		return await this.skillSetsService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.skillSetsService.findOne(id);
	}
}
