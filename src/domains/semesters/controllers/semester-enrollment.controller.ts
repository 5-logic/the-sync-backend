import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { SEMESTER_API_TAGS, SEMESTER_CONSTANTS } from '@/semesters/constants';
import { SemesterEnrollmentDocs } from '@/semesters/docs';
import { UpdateEnrollmentsDto } from '@/semesters/dto';
import { SemesterEnrollmentService } from '@/semesters/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(SEMESTER_API_TAGS)
@Controller(`${SEMESTER_CONSTANTS.BASE}`)
export class SemesterEnrollmentController {
	constructor(private readonly service: SemesterEnrollmentService) {}

	@Roles(Role.ADMIN)
	@Put(':id/enrollments')
	@ApiOperation(SemesterEnrollmentDocs.update)
	async update(@Param('id') id: string, @Body() dto: UpdateEnrollmentsDto) {
		return await this.service.update(id, dto);
	}
}
