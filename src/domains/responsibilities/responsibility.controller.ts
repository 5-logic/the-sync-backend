import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { ResponsibilityService } from '@/responsibilities/responsibility.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Responsibility')
@Controller('responsibilities')
export class ResponsibilityController {
	constructor(private readonly reponsibilityService: ResponsibilityService) {}

	@Get()
	async findAll() {
		return await this.reponsibilityService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.reponsibilityService.findOne(id);
	}
}
