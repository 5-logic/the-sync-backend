import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard } from '@/auth';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import { ThesisPublishService } from '@/theses/services/thesis-publish.service';

@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags('Thesis - Public')
@Controller('theses')
export class ThesisPublishController {
	constructor(private readonly thesisPublishService: ThesisPublishService) {}

	@SwaggerDoc('thesis', 'findAll')
	@Get()
	async findAll() {
		return await this.thesisPublishService.findAll();
	}

	@SwaggerDoc('thesis', 'findAllBySemesterId')
	@Get('semester/:semesterId')
	async findAllBySemesterId(@Param('semesterId') semesterId: string) {
		return await this.thesisPublishService.findAllBySemesterId(semesterId);
	}

	@SwaggerDoc('thesis', 'findOne')
	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.thesisPublishService.findOne(id);
	}
}
