import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { SwaggerDoc } from '@/common/docs/swagger-docs.decorator';
import {
	CreateStudentDto,
	ImportStudentDto,
	SelfUpdateStudentDto,
	ToggleStudentStatusDto,
	UpdateStudentDto,
} from '@/students/dtos';
import { StudentService } from '@/students/student.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Student')
@Controller('students')
export class StudentController {
	constructor(private readonly studentService: StudentService) {}

	@Roles(Role.ADMIN)
	@Post()
	@SwaggerDoc('student', 'create')
	async create(@Body() dto: CreateStudentDto) {
		return await this.studentService.create(dto);
	}

	@Roles(Role.ADMIN)
	@Post('import')
	@SwaggerDoc('student', 'createMany')
	async createMany(@Body() dto: ImportStudentDto) {
		return await this.studentService.createMany(dto);
	}

	@Get()
	@SwaggerDoc('student', 'findAll')
	async findAll() {
		return await this.studentService.findAll();
	}

	@Get('semester/:semesterId')
	@SwaggerDoc('student', 'findAllBySemester')
	async findAllBySemester(@Param('semesterId') semesterId: string) {
		return await this.studentService.findAllBySemester(semesterId);
	}

	@Get('semester/:semesterId/without-group')
	@SwaggerDoc('student', 'findStudentsWithoutGroup')
	async findStudentsWithoutGroup(@Param('semesterId') semesterId: string) {
		return await this.studentService.findStudentsWithoutGroup(semesterId);
	}

	@Get(':id')
	@SwaggerDoc('student', 'findOne')
	async findOne(@Param('id') id: string) {
		return await this.studentService.findOne(id);
	}

	@Roles(Role.STUDENT)
	@Put()
	@SwaggerDoc('student', 'update')
	async update(@Req() req: Request, @Body() dto: SelfUpdateStudentDto) {
		const user = req.user as UserPayload;

		return await this.studentService.update(user.id, dto);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@SwaggerDoc('student', 'updateByAdmin')
	async updateByAdmin(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
		return await this.studentService.updateByAdmin(id, dto);
	}

	@Roles(Role.ADMIN)
	@Post(':id/toggle-status')
	@SwaggerDoc('student', 'toggleStatus')
	async toggleStatus(
		@Param('id') id: string,
		@Body() dto: ToggleStudentStatusDto,
	) {
		return await this.studentService.toggleStatus(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id/semester/:semesterId')
	@SwaggerDoc('student', 'delete')
	async delete(
		@Param('id') id: string,
		@Param('semesterId') semesterId: string,
	) {
		return await this.studentService.delete(id, semesterId);
	}
}
