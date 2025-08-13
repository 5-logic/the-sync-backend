import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { Roles } from '@/auth/decorators';
import { Role } from '@/auth/enums';
import { UserPayload } from '@/auth/interfaces';
import {
	THESIS_APPLICATION_API_TAGS,
	THESIS_APPLICATION_CONSTANTS,
} from '@/thesis-application/constants';
import { ThesisApplicationLecturerDocs } from '@/thesis-application/docs';
import { UpdateThesisApplicationDto } from '@/thesis-application/dtos';
import { ThesisApplicationLecturerService } from '@/thesis-application/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(THESIS_APPLICATION_API_TAGS)
@Controller(THESIS_APPLICATION_CONSTANTS.BASE)
export class ThesisApplicationLecturerController {
	constructor(
		private readonly thesisApplicationLecturerService: ThesisApplicationLecturerService,
	) {}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@Get(':semesterId')
	@HttpCode(HttpStatus.OK)
	@ApiOperation(ThesisApplicationLecturerDocs.findAll)
	async findAll(@Req() req: Request, @Param('semesterId') semesterId?: string) {
		const user = req.user as UserPayload;

		return this.thesisApplicationLecturerService.findAll(user.id, semesterId);
	}

	@Roles(Role.MODERATOR, Role.LECTURER, Role.STUDENT)
	@Get('thesis/:thesisId')
	@HttpCode(HttpStatus.OK)
	@ApiOperation(ThesisApplicationLecturerDocs.findOne)
	async findOne(@Param('thesisId') thesisId: string) {
		return this.thesisApplicationLecturerService.findOne(thesisId);
	}

	@Roles(Role.LECTURER)
	@Put(':groupId/:thesisId')
	@HttpCode(HttpStatus.OK)
	@ApiOperation(ThesisApplicationLecturerDocs.update)
	async update(
		@Req() req: Request,
		@Param('groupId') groupId: string,
		@Param('thesisId') thesisId: string,
		@Body() dto: UpdateThesisApplicationDto,
	) {
		const user = req.user as UserPayload;

		return this.thesisApplicationLecturerService.update(
			user.id,
			groupId,
			thesisId,
			dto,
		);
	}
}
