import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '@/auth/guards/jwt-access.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { MajorService } from '@/domains/majors/major.service';

@UseGuards(RoleGuard)
@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags('Majors')
@Controller('majors')
export class MajorController {
	constructor(private readonly majorService: MajorService) {}

	@Get()
	findAll() {
		return this.majorService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.majorService.findOne(id);
	}
}
