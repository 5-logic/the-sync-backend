import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { MAJOR_API_TAGS, MAJOR_CONSTANTS } from '@/majors/constants';
import { MajorDocs } from '@/majors/docs';
import { MajorService } from '@/majors/services';

@UseGuards(RoleGuard)
@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags(MAJOR_API_TAGS)
@Controller(MAJOR_CONSTANTS.BASE)
export class MajorController {
	constructor(private readonly service: MajorService) {}

	@Get()
	@ApiOperation(MajorDocs.findAll)
	async findAll() {
		return await this.service.findAll();
	}

	@Get(':id')
	@ApiOperation(MajorDocs.findOne)
	async findOne(@Param('id') id: string) {
		return await this.service.findOne(id);
	}
}
