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
import {
	CreateStudentDto,
	ImportStudentDto,
	SelfUpdateStudentDto,
	ToggleStudentStatusDto,
	UpdateStudentDto,
} from '@/students/dto';
import { StudentService } from '@/students/student.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Student')
@Controller('students')
export class StudentController {
	constructor(private readonly studentService: StudentService) {}

	@Roles(Role.ADMIN)
	@Post()
	async create(@Body() dto: CreateStudentDto) {
		return await this.studentService.create(dto);
	}

	@Roles(Role.ADMIN)
	@Post('import')
	async createMany(@Body() dto: ImportStudentDto) {
		return await this.studentService.createMany(dto);
	}

	@Get()
	async findAll() {
		return await this.studentService.findAll();
	}

	@Get('semester/:semesterId')
	async findAllBySemester(@Param('semesterId') semesterId: string) {
		return await this.studentService.findAllBySemester(semesterId);
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.studentService.findOne(id);
	}

	@Roles(Role.STUDENT)
	@Put()
	async update(@Req() req: Request, @Body() dto: SelfUpdateStudentDto) {
		const user = req.user as UserPayload;

		return await this.studentService.update(user.id, dto);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	async updateByAdmin(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
		return await this.studentService.updateByAdmin(id, dto);
	}

	@Roles(Role.ADMIN)
	@Post(':id/toggle-status')
	async toggleStatus(
		@Param('id') id: string,
		@Body() dto: ToggleStudentStatusDto,
	) {
		return await this.studentService.toggleStatus(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id/semester/:semesterId')
	async delete(
		@Param('id') id: string,
		@Param('semesterId') semesterId: string,
	) {
		return await this.studentService.delete(id, semesterId);
	}
}
