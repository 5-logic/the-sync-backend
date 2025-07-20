import {
	Body,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { STUDENT_API_TAGS, STUDENT_CONSTANTS } from '@/students/constants';
import { StudentAdminDocs } from '@/students/docs';
import {
	CreateStudentDto,
	ImportStudentDto,
	ToggleStudentStatusDto,
	UpdateStudentDto,
} from '@/students/dtos';
import { StudentAdminService } from '@/students/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(STUDENT_API_TAGS)
@Controller(STUDENT_CONSTANTS.BASE)
export class StudentAdminController {
	constructor(private readonly service: StudentAdminService) {}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	@ApiOperation(StudentAdminDocs.create)
	async create(@Body() dto: CreateStudentDto) {
		return await this.service.create(dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.CREATED)
	@Post('import')
	@ApiOperation(StudentAdminDocs.createMany)
	async createMany(@Body() dto: ImportStudentDto) {
		return await this.service.createMany(dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Put(':id')
	@ApiOperation(StudentAdminDocs.updateByAdmin)
	async updateByAdmin(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
		return await this.service.updateByAdmin(id, dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Post(':id/toggle-status')
	@ApiOperation(StudentAdminDocs.toggleStatus)
	async toggleStatus(
		@Param('id') id: string,
		@Body() dto: ToggleStudentStatusDto,
	) {
		return await this.service.toggleStatus(id, dto);
	}

	@Roles(Role.ADMIN)
	@HttpCode(HttpStatus.OK)
	@Delete(':id/semester/:semesterId')
	@ApiOperation(StudentAdminDocs.delete)
	async delete(
		@Param('id') id: string,
		@Param('semesterId') semesterId: string,
	) {
		return await this.service.delete(id, semesterId);
	}
}
