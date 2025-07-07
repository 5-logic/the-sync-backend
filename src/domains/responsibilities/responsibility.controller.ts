import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import { ResponsibilityService } from '@/responsibilities/responsibility.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Responsibility')
@Controller('responsibilities')
export class ResponsibilityController {
	constructor(private readonly responsibilityService: ResponsibilityService) {}

	@Get()
	@SwaggerDoc('responsibility', 'findAll')
	async findAll() {
		return await this.responsibilityService.findAll();
	}

	@Get(':id')
	@SwaggerDoc('responsibility', 'findOne')
	async findOne(@Param('id') id: string) {
		return await this.responsibilityService.findOne(id);
	}
}
