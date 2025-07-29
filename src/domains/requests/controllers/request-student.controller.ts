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

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { REQUEST_API_TAGS, REQUEST_CONSTANTS } from '@/requests/constants';
import { RequestStudentDocs } from '@/requests/docs';
import {
	CreateInviteRequestDto,
	CreateJoinRequestDto,
	UpdateRequestStatusDto,
} from '@/requests/dtos';
import { RequestStudentService } from '@/requests/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(REQUEST_API_TAGS)
@Controller(REQUEST_CONSTANTS.BASE)
export class RequestStudentController {
	constructor(private readonly service: RequestStudentService) {}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.CREATED)
	@Post('join')
	@ApiOperation(RequestStudentDocs.createJoinRequest)
	async createJoinRequest(
		@Req() req: Request,
		@Body() dto: CreateJoinRequestDto,
	) {
		const user = req.user as UserPayload;
		return await this.service.createJoinRequest(user.id, dto);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.CREATED)
	@Post('invite/:groupId')
	@ApiOperation(RequestStudentDocs.createInviteRequest)
	async createInviteRequest(
		@Req() req: Request,
		@Param('groupId') groupId: string,
		@Body() dto: CreateInviteRequestDto,
	) {
		const user = req.user as UserPayload;
		return await this.service.createInviteRequest(user.id, groupId, dto);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Get('student')
	@ApiOperation(RequestStudentDocs.getStudentRequests)
	async getStudentRequests(@Req() req: Request) {
		const user = req.user as UserPayload;
		return await this.service.getStudentRequests(user.id);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Get('group/:groupId')
	@ApiOperation(RequestStudentDocs.getGroupRequests)
	async getGroupRequests(
		@Req() req: Request,
		@Param('groupId') groupId: string,
	) {
		const user = req.user as UserPayload;
		return await this.service.getGroupRequests(user.id, groupId);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Get(':requestId')
	@ApiOperation(RequestStudentDocs.findOne)
	async findOne(@Req() req: Request, @Param('requestId') requestId: string) {
		const user = req.user as UserPayload;
		return await this.service.findOne(user.id, requestId);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Put(':requestId/status')
	@ApiOperation(RequestStudentDocs.updateRequestStatus)
	async updateRequestStatus(
		@Req() req: Request,
		@Param('requestId') requestId: string,
		@Body() dto: UpdateRequestStatusDto,
	) {
		const user = req.user as UserPayload;
		return await this.service.updateRequestStatus(user.id, requestId, dto);
	}

	@Roles(Role.STUDENT)
	@HttpCode(HttpStatus.OK)
	@Delete(':requestId')
	@ApiOperation(RequestStudentDocs.cancelRequest)
	async cancelRequest(
		@Req() req: Request,
		@Param('requestId') requestId: string,
	) {
		const user = req.user as UserPayload;
		return await this.service.cancelRequest(user.id, requestId);
	}
}
