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

import { CreateSemesterDto } from '@/semesters/dto/create-semester.dto';
import { UpdateSemesterDto } from '@/semesters/dto/update-semester.dto';
import { SemesterService } from '@/semesters/semester.service';

@ApiTags('Semester')
@Controller('semester')
export class SemesterController {
	constructor(private readonly semesterService: SemesterService) {}

	@Post()
	async create(@Body() createSemesterDto: CreateSemesterDto) {
		return await this.semesterService.create(createSemesterDto);
	}

	@Get()
	async findAll() {
		return await this.semesterService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.semesterService.findOne(id);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateSemesterDto: UpdateSemesterDto,
	) {
		return await this.semesterService.update(id, updateSemesterDto);
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return await this.semesterService.remove(id);
	}
}
