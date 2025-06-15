import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { CreateStudentDto } from '@/students/dto/create-student.dto';
import { UpdateStudentDto } from '@/students/dto/update-student.dto';
import { StudentService } from '@/students/student.service';

@ApiTags('Student')
@Controller('students')
export class StudentController {
	constructor(private readonly studentService: StudentService) {}

	@Post()
	async create(@Body() createStudentDto: CreateStudentDto) {
		return await this.studentService.create(createStudentDto);
	}

	@ApiBody({ type: [CreateStudentDto] })
	@Post('import')
	async createMany(@Body() createStudentDtos: CreateStudentDto[]) {
		return await this.studentService.createMany(createStudentDtos);
	}

	@Get()
	async findAll() {
		return await this.studentService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.studentService.findOne(id);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateStudentDto: UpdateStudentDto,
	) {
		return await this.studentService.update(id, updateStudentDto);
	}
}
