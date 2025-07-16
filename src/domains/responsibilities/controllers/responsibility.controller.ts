import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import {
	RESPONSIBILITY_API_TAGS,
	RESPONSIBILITY_CONSTANTS,
} from '@/responsibilities/constants';
import { ResponsibilityDocs } from '@/responsibilities/docs';
import { ResponsibilityService } from '@/responsibilities/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(RESPONSIBILITY_API_TAGS)
@Controller(RESPONSIBILITY_CONSTANTS.BASE)
export class ResponsibilityController {
	constructor(private readonly service: ResponsibilityService) {}

	@Get()
	@ApiOperation(ResponsibilityDocs.findAll)
	async findAll() {
		return await this.service.findAll();
	}

	@Get(':id')
	@ApiOperation(ResponsibilityDocs.findOne)
	async findOne(@Param('id') id: string) {
		return await this.service.findOne(id);
	}
}
