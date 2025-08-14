import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import {
	JwtAccessAuthGuard,
	Role,
	RoleGuard,
	Roles,
	UserPayload,
} from '@/auth';
import {
	THESIS_APPLICATION_API_TAGS,
	THESIS_APPLICATION_CONSTANTS,
} from '@/thesis-application/constants';
import { ThesisApplicationStudentDocs } from '@/thesis-application/docs';
import { CreateThesisApplicationDto } from '@/thesis-application/dtos';
import { ThesisApplicationStudentService } from '@/thesis-application/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(THESIS_APPLICATION_API_TAGS)
@Controller(THESIS_APPLICATION_CONSTANTS.BASE)
export class ThesisApplicationStudentController {
	constructor(private readonly service: ThesisApplicationStudentService) {}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.CREATED)
	@Post(':semesterId')
	@ApiOperation(ThesisApplicationStudentDocs.create)
	async create(
		@Param('semesterId') semesterId: string,
		@Req() req: Request,
		@Body() dto: CreateThesisApplicationDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.create(semesterId, user.id, dto);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Get(':semesterId/:groupId')
	@ApiOperation(ThesisApplicationStudentDocs.findAll)
	async findAll(
		@Param('semesterId') semesterId: string,
		@Param('groupId') groupId: string,
	) {
		return await this.service.findAll(semesterId, groupId);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put(':groupId/:thesisId/cancel')
	@ApiOperation(ThesisApplicationStudentDocs.cancel)
	async cancel(
		@Param('groupId') groupId: string,
		@Param('thesisId') thesisId: string,
		@Req() req: Request,
	) {
		const user = req.user as UserPayload;

		return await this.service.cancel(groupId, thesisId, user.id);
	}
}
