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
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt-access.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { CreateStudentDto } from '@/students/dto/create-student.dto';
import { ToggleStudentStatusDto } from '@/students/dto/toggle-student-status.dto';
import { UpdateStudentDto } from '@/students/dto/update-student.dto';
import { StudentService } from '@/students/student.service';

@UseGuards(RoleGuard)
@UseGuards(JwtAccessAuthGuard)
@ApiBearerAuth()
@ApiTags('Student')
@Controller('students')
export class StudentController {
	constructor(private readonly studentService: StudentService) {}

	@Roles(Role.ADMIN)
	@Post()
	async create(@Body() createStudentDto: CreateStudentDto) {
		return await this.studentService.create(createStudentDto);
	}

	@Roles(Role.ADMIN)
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

	@Roles(Role.STUDENT)
	@Put()
	async update(
		@Req() request: Request,
		@Body() updateStudentDto: UpdateStudentDto,
	) {
		const user = request.user as UserPayload;

		return await this.studentService.update(user.id, updateStudentDto);
	}

	@Roles(Role.ADMIN)
	@Post(':id/toggle-status')
	async toggleStatus(
		@Param('id') id: string,
		@Body() toggleStudentStatusDto: ToggleStudentStatusDto,
	) {
		return await this.studentService.toggleStatus(id, toggleStudentStatusDto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id')
	async remove(@Param('id') id: string) {
		return await this.studentService.remove(id);
	}
}
