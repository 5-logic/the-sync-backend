import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ThesisService } from '@/theses/thesis.service';

@ApiTags('Thesis')
@Controller('theses')
export class ThesisController {
	constructor(private readonly thesisService: ThesisService) {}

	@Get()
	async findAll() {
		return await this.thesisService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.thesisService.findOne(id);
	}
}
