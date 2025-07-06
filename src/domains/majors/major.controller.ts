import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { MajorService } from '@/domains/majors/major.service';

@UseGuards(RoleGuard)
@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags('Major')
@Controller('majors')
export class MajorController {
	constructor(private readonly majorService: MajorService) {}

	@Get()
	@ApiOperation({
		summary: 'Get all majors',
		description: 'Retrieve all available majors in the system.',
	})
	findAll() {
		return this.majorService.findAll();
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get major by ID',
		description: 'Retrieve specific major information by ID.',
	})
	findOne(@Param('id') id: string) {
		return this.majorService.findOne(id);
	}
}
