import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
} from '@nestjs/common';

import { CreateMajorDto } from '@/majors/dto/create-major.dto';
import { UpdateMajorDto } from '@/majors/dto/update-major.dto';
import { MajorService } from '@/majors/major.service';

@Controller('major')
export class MajorController {
	constructor(private readonly majorService: MajorService) {}

	@Post()
	async create(@Body() createMajorDto: CreateMajorDto) {
		return await this.majorService.create(createMajorDto);
	}

	@Get()
	async findAll() {
		return await this.majorService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.majorService.findOne(id);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateMajorDto: UpdateMajorDto,
	) {
		return await this.majorService.update(id, updateMajorDto);
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return await this.majorService.remove(id);
	}
}
