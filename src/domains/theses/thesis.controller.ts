import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateThesisDto } from '@/theses/dto/create-thesis.dto';
import { UpdateThesisDto } from '@/theses/dto/update-thesis.dto';
import { ThesisService } from '@/theses/thesis.service';

@ApiTags('Thesis')
@Controller('theses')
export class ThesisController {
	constructor(private readonly thesisService: ThesisService) {}

	@Post()
	async create(@Body() createThesisDto: CreateThesisDto) {
		return await this.thesisService.create(createThesisDto);
	}

	@Get()
	async findAll() {
		return await this.thesisService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.thesisService.findOne(id);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateThesisDto: UpdateThesisDto,
	) {
		return await this.thesisService.update(id, updateThesisDto);
	}
}
