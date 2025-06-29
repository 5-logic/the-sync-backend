import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { CreateSemesterDto, UpdateSemesterDto } from '@/semesters/dto';
import { SemesterService } from '@/semesters/semester.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Semester')
@Controller('semesters')
export class SemesterController {
	constructor(private readonly semesterService: SemesterService) {}

	@Roles(Role.ADMIN)
	@Post()
	async create(@Body() dto: CreateSemesterDto) {
		return await this.semesterService.create(dto);
	}

	@Get()
	async findAll() {
		return await this.semesterService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.semesterService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	async update(@Param('id') id: string, @Body() dto: UpdateSemesterDto) {
		return await this.semesterService.update(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	async remove(@Param('id') id: string) {
		return await this.semesterService.remove(id);
	}
}
