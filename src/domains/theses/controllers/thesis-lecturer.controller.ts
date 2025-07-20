import {
	Body,
	Controller,
	Delete,
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
import { ApiBaseResponse } from '@/common';
import { THESIS_API_TAGS, THESIS_CONSTANTS } from '@/theses/constants';
import { ThesisLecturerDocs } from '@/theses/docs';
import { CreateThesisDto, UpdateThesisDto } from '@/theses/dtos';
import { ThesisDetailResponse, ThesisResponse } from '@/theses/responses';
import { ThesisLecturerService } from '@/theses/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(THESIS_API_TAGS)
@Controller(THESIS_CONSTANTS.BASE)
export class ThesisLecturerController {
	constructor(private readonly service: ThesisLecturerService) {}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@HttpCode(HttpStatus.CREATED)
	@Post()
	@ApiOperation(ThesisLecturerDocs.create)
	@ApiBaseResponse(ThesisDetailResponse, HttpStatus.CREATED)
	async create(
		@Req() req: Request,
		@Body() dto: CreateThesisDto,
	): Promise<ThesisDetailResponse> {
		const user = req.user as UserPayload;

		return await this.service.create(user.id, dto);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Get('lecturer/:lecturerId')
	@ApiOperation(ThesisLecturerDocs.findAllByLecturerId)
	async findAllByLecturerId(@Param('lecturerId') lecturerId: string) {
		return await this.service.findAllByLecturerId(lecturerId);
	}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@HttpCode(HttpStatus.OK)
	@Put(':id')
	@ApiOperation(ThesisLecturerDocs.update)
	async update(
		@Req() req: Request,
		@Param('id') id: string,
		@Body() dto: UpdateThesisDto,
	) {
		const user = req.user as UserPayload;

		return await this.service.update(user.id, id, dto);
	}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@HttpCode(HttpStatus.OK)
	@Post(':id/submit')
	@ApiOperation(ThesisLecturerDocs.submitForReview)
	async submitForReview(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as UserPayload;

		return await this.service.submitForReview(user.id, id);
	}

	@Roles(Role.MODERATOR, Role.LECTURER)
	@HttpCode(HttpStatus.OK)
	@Delete(':id')
	@ApiOperation(ThesisLecturerDocs.remove)
	@ApiBaseResponse(ThesisResponse, HttpStatus.OK)
	async remove(
		@Req() req: Request,
		@Param('id') id: string,
	): Promise<ThesisResponse> {
		const user = req.user as UserPayload;

		return await this.service.remove(user.id, id);
	}
}
