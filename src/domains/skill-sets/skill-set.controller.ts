import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import { SkillSetService } from '@/domains/skill-sets/skill-set.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('SkillSets')
@Controller('skill-sets')
export class SkillSetController {
	constructor(private readonly skillSetsService: SkillSetService) {}

	@Get()
	@SwaggerDoc('skillSet', 'findAll')
	async findAll() {
		return await this.skillSetsService.findAll();
	}

	@Get(':id')
	@SwaggerDoc('skillSet', 'findOne')
	async findOne(@Param('id') id: string) {
		return await this.skillSetsService.findOne(id);
	}
}
