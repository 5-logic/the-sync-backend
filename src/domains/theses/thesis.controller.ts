import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
} from '@nestjs/common';
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
		return await this.thesisService.create(
			createThesisDto,
			'3f333df6-90a4-4fda-8dd3-9485d27cee36',
		);
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
		return await this.thesisService.update(
			id,
			updateThesisDto,
			'3f333df6-90a4-4fda-8dd3-9485d27cee36',
		);
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return await this.thesisService.remove(id);
	}
}
