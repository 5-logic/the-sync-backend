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
import { FastifyRequest } from 'fastify';

import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt-access.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { CreateStudentDto } from '@/students/dto/create-student.dto';
import { ImportStudentDto } from '@/students/dto/import-student.dto';
import { ToggleStudentStatusDto } from '@/students/dto/toggle-student-status.dto';
import { UpdateStudentDto } from '@/students/dto/update-student.dto';
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
	async update(@Req() req: FastifyRequest, @Body() dto: UpdateStudentDto) {
		const user = req.user as UserPayload;

		return await this.studentService.update(user.id, dto);
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
