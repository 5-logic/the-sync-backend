import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { ApiArrayResponse, ApiBaseResponse } from '@/common';
import { STUDENT_API_TAGS, STUDENT_CONSTANTS } from '@/students/constants';
import { StudentPublicDocs } from '@/students/docs';
import { StudentDetailResponse, StudentResponse } from '@/students/responses';
import { StudentPublicService } from '@/students/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(STUDENT_API_TAGS)
@Controller(STUDENT_CONSTANTS.BASE)
export class StudentPublicController {
	constructor(private readonly service: StudentPublicService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(StudentPublicDocs.findAll)
	@ApiArrayResponse(StudentResponse, HttpStatus.OK)
	async findAll(): Promise<StudentResponse[]> {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(StudentPublicDocs.findOne)
	@ApiBaseResponse(StudentDetailResponse, HttpStatus.OK)
	async findOne(@Param('id') id: string): Promise<StudentDetailResponse> {
		return await this.service.findOne(id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('semester/:semesterId')
	@ApiOperation(StudentPublicDocs.findAllBySemester)
	@ApiArrayResponse(StudentResponse, HttpStatus.OK)
	async findAllBySemester(
		@Param('semesterId') semesterId: string,
	): Promise<StudentResponse[]> {
		return await this.service.findAllBySemester(semesterId);
	}

	@HttpCode(HttpStatus.OK)
	@Get('semester/:semesterId/without-group')
	@ApiOperation(StudentPublicDocs.findStudentsWithoutGroup)
	@ApiArrayResponse(StudentResponse, HttpStatus.OK)
	async findStudentsWithoutGroup(
		@Param('semesterId') semesterId: string,
	): Promise<StudentResponse[]> {
		return await this.service.findStudentsWithoutGroup(semesterId);
	}
}
