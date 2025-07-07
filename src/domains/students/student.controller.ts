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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
	@ApiOperation({
		summary: 'Create student',
		description:
			'Create a new student or enroll an existing student in a semester. Only administrators can create students. Validates that the semester is in PREPARING status before allowing enrollment. If student already exists with the same student code, enrolls them in the specified semester with a new password. Automatically generates a secure password and sends welcome email with login credentials.',
	})
	async create(@Body() dto: CreateStudentDto) {
		return await this.studentService.create(dto);
	}

	@Roles(Role.ADMIN)
	@Post('import')
	@ApiOperation({
		summary: 'Import students in batch',
		description:
			'Import multiple students in a single operation for a specific semester and major. Only administrators can import students. Validates that the semester is in PREPARING status. For each student: creates new account if not exists, or enrolls existing student with new password. Automatically generates secure passwords and sends bulk welcome emails. Uses database transactions for data consistency.',
	})
	async createMany(@Body() dto: ImportStudentDto) {
		return await this.studentService.createMany(dto);
	}

	@Get()
	@ApiOperation({
		summary: 'Get all students',
		description:
			'Retrieve all students in the system with their basic information including personal details and student codes. Results are cached for performance optimization. Returns formatted student data without sensitive information like passwords.',
	})
	async findAll() {
		return await this.studentService.findAll();
	}

	@Get('semester/:semesterId')
	@ApiOperation({
		summary: 'Get students by semester',
		description:
			'Retrieve all students enrolled in a specific semester. Returns student information for those who have active enrollments in the specified semester. Results are cached for performance. Useful for semester-specific student management and reporting.',
	})
	async findAllBySemester(@Param('semesterId') semesterId: string) {
		return await this.studentService.findAllBySemester(semesterId);
	}

	@Get('semester/:semesterId/without-group')
	@ApiOperation({
		summary: 'Get students without group',
		description:
			'Retrieve students enrolled in a specific semester who are not yet assigned to any group. Useful for group assignment operations and tracking unassigned students. Results include student details and major information.',
	})
	async findStudentsWithoutGroup(@Param('semesterId') semesterId: string) {
		return await this.studentService.findStudentsWithoutGroup(semesterId);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get student by ID',
		description:
			'Retrieve detailed information about a specific student by their user ID. Returns comprehensive student data including personal information, student code, and major details. Results are cached for performance.',
	})
	async findOne(@Param('id') id: string) {
		return await this.studentService.findOne(id);
	}

	@Roles(Role.STUDENT)
	@Put()
	@ApiOperation({
		summary: 'Update my profile',
		description:
			'Allow students to update their own profile information including full name, gender, phone number, skills, and expected responsibilities. Students can only update their own profile (authenticated user). Cannot modify student code, email, or major - those require administrator access. Skills and responsibilities are completely replaced when provided (not merged).',
	})
	async update(@Req() req: Request, @Body() dto: SelfUpdateStudentDto) {
		const user = req.user as UserPayload;

		return await this.studentService.update(user.id, dto);
	}

	@Roles(Role.ADMIN)
	@Put(':id')
	@ApiOperation({
		summary: 'Update student by admin',
		description:
			'Allow administrators to update any student information including email, personal details, student code, and major assignment. Full administrative access to modify all student data. Uses database transactions to ensure data consistency across user and student tables.',
	})
	async updateByAdmin(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
		return await this.studentService.updateByAdmin(id, dto);
	}

	@Roles(Role.ADMIN)
	@Post(':id/toggle-status')
	@ApiOperation({
		summary: 'Toggle student active status',
		description:
			'Enable or disable a student account by toggling their active status. Only administrators can perform this action. When disabled, students cannot log in or access the system. Useful for temporary account suspension or reactivation.',
	})
	async toggleStatus(
		@Param('id') id: string,
		@Body() dto: ToggleStudentStatusDto,
	) {
		return await this.studentService.toggleStatus(id, dto);
	}

	@Roles(Role.ADMIN)
	@Delete(':id/semester/:semesterId')
	@ApiOperation({
		summary: 'Delete student from semester',
		description:
			'Remove a student from a specific semester or delete the student entirely. Only administrators can perform this action. Can only be done when semester is in PREPARING status. If student is enrolled in multiple semesters, only removes enrollment from specified semester. If only enrolled in one semester, completely removes student and user account.',
	})
	async delete(
		@Param('id') id: string,
		@Param('semesterId') semesterId: string,
	) {
		return await this.studentService.delete(id, semesterId);
	}
}
