import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import { MajorService } from '@/domains/majors/major.service';

@UseGuards(RoleGuard)
@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags('Major')
@Controller('majors')
export class MajorController {
	constructor(private readonly majorService: MajorService) {}

	@Get()
	@SwaggerDoc('major', 'findAll')
	findAll() {
		return this.majorService.findAll();
	}

	@Get(':id')
	@SwaggerDoc('major', 'findOne')
	findOne(@Param('id') id: string) {
		return this.majorService.findOne(id);
	}
}
