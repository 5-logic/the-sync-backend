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

import {
	JwtAccessAuthGuard,
	Role,
	RoleGuard,
	Roles,
	UserPayload,
} from '@/auth';
import { ApiArrayResponse, ApiBaseResponse } from '@/common';
import { LecturerDocs } from '@/lecturers//docs';
import { LECTURER_API_TAGS, LECTURER_CONSTANTS } from '@/lecturers/constants';
import { LecturerResponse } from '@/lecturers/responses';
import { LecturerService } from '@/lecturers/services';
import { UpdateUserDto } from '@/users/index';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(LECTURER_API_TAGS)
@Controller(LECTURER_CONSTANTS.BASE)
export class LecturerController {
	constructor(private readonly service: LecturerService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(LecturerDocs.findAll)
	@ApiArrayResponse(LecturerResponse, HttpStatus.OK)
	async findAll(): Promise<LecturerResponse[]> {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(LecturerDocs.findOne)
	@ApiBaseResponse(LecturerResponse, HttpStatus.OK)
	async findOne(@Param('id') id: string): Promise<LecturerResponse> {
		return await this.service.findOne(id);
	}

	@Roles(Role.LECTURER, Role.MODERATOR)
	@HttpCode(HttpStatus.OK)
	@Put()
	@ApiOperation(LecturerDocs.update)
	@ApiBaseResponse(LecturerResponse, HttpStatus.OK)
	async update(
		@Req() req: Request,
		@Body() dto: UpdateUserDto,
	): Promise<LecturerResponse> {
		const user = req.user as UserPayload;

		return await this.service.update(user.id, dto);
	}
}
