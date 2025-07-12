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
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import {
	CreateSemesterDto,
	UpdateEnrollmentsDto,
	UpdateSemesterDto,
} from '@/semesters/dto';
import { SemesterService } from '@/semesters/semester.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Semester')
@Controller('semesters')
export class SemesterController {
	constructor(private readonly semesterService: SemesterService) {}

	@Roles(Role.ADMIN)
	@Post()
	@SwaggerDoc('semester', 'create')
	async create(@Body() dto: CreateSemesterDto) {
		return await this.semesterService.create(dto);
	}

	@Get()
	@SwaggerDoc('semester', 'findAll')
	async findAll() {
		return await this.semesterService.findAll();
	}

	@Get(':id')
	@SwaggerDoc('semester', 'findOne')
	async findOne(@Param('id') id: string) {
		return await this.semesterService.findOne(id);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@SwaggerDoc('semester', 'update')
	async update(@Param('id') id: string, @Body() dto: UpdateSemesterDto) {
		return await this.semesterService.update(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	@SwaggerDoc('semester', 'remove')
	async remove(@Param('id') id: string) {
		return await this.semesterService.remove(id);
	}

	@Roles(Role.ADMIN)
	@Put(':id/enrollments')
	async updateEnrollments(
		@Param('id') id: string,
		@Body() dto: UpdateEnrollmentsDto,
	) {
		return await this.semesterService.updateEnrollments(id, dto);
	}
}
