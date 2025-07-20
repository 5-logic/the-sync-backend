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
import { STUDENT_API_TAGS, STUDENT_CONSTANTS } from '@/students/constants';
import { StudentPublicDocs } from '@/students/docs';
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
	async findAll() {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(StudentPublicDocs.findOne)
	async findOne(@Param('id') id: string) {
		return await this.service.findOne(id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('semester/:semesterId')
	@ApiOperation(StudentPublicDocs.findAllBySemester)
	async findAllBySemester(@Param('semesterId') semesterId: string) {
		return await this.service.findAllBySemester(semesterId);
	}

	@HttpCode(HttpStatus.OK)
	@Get('semester/:semesterId/without-group')
	@ApiOperation(StudentPublicDocs.findStudentsWithoutGroup)
	async findStudentsWithoutGroup(@Param('semesterId') semesterId: string) {
		return await this.service.findStudentsWithoutGroup(semesterId);
	}
}
