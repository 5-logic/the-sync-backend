import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { CreateLecturerDto } from '@/lecturers/dto/create-lecturer.dto';
import { UpdateLecturerDto } from '@/lecturers/dto/update-lecturer.dto';
import { LecturerService } from '@/lecturers/lecturer.service';

@ApiTags('Lecturer')
@Controller('lecturers')
export class LecturerController {
	constructor(private readonly lecturerService: LecturerService) {}

	@Post()
	async create(@Body() createLecturerDto: CreateLecturerDto) {
		return await this.lecturerService.create(createLecturerDto);
	}

	@ApiBody({ type: [CreateLecturerDto] })
	@Post('import')
	async createMany(@Body() createLecturerDtos: CreateLecturerDto[]) {
		return await this.lecturerService.createMany(createLecturerDtos);
	}

	@Get()
	async findAll() {
		return await this.lecturerService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.lecturerService.findOne(id);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateLecturerDto: UpdateLecturerDto,
	) {
		return await this.lecturerService.update(id, updateLecturerDto);
	}
}
