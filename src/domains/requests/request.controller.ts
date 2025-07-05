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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, Role, RoleGuard, Roles } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import {
	CreateInviteRequestDto,
	CreateJoinRequestDto,
	UpdateRequestStatusDto,
} from '@/requests/dto';

import { RequestService } from '~/src/domains/requests/request.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Requests')
@Controller('requests')
export class RequestController {
	constructor(private readonly requestsService: RequestService) {}

	@Roles(Role.STUDENT)
	@Post('join')
	async createJoinRequest(
		@Req() req: Request,
		@Body() dto: CreateJoinRequestDto,
	) {
		const user = req.user as UserPayload;
		return await this.requestsService.createJoinRequest(user.id, dto);
	}

	@Roles(Role.STUDENT)
	@Post('invite/:groupId')
	async createInviteRequest(
		@Req() req: Request,
		@Param('groupId') groupId: string,
		@Body() dto: CreateInviteRequestDto,
	) {
		const user = req.user as UserPayload;
		return await this.requestsService.createInviteRequest(
			user.id,
			groupId,
			dto,
		);
	}

	@Roles(Role.STUDENT)
	@Get('student')
	async getStudentRequests(@Req() req: Request) {
		const user = req.user as UserPayload;
		return await this.requestsService.getStudentRequests(user.id);
	}

	@Roles(Role.STUDENT)
	@Get('group/:groupId')
	async getGroupRequests(
		@Req() req: Request,
		@Param('groupId') groupId: string,
	) {
		const user = req.user as UserPayload;
		return await this.requestsService.getGroupRequests(user.id, groupId);
	}

	@Roles(Role.STUDENT)
	@Put(':requestId/status')
	async updateRequestStatus(
		@Req() req: Request,
		@Param('requestId') requestId: string,
		@Body() dto: UpdateRequestStatusDto,
	) {
		const user = req.user as UserPayload;
		return await this.requestsService.updateRequestStatus(
			user.id,
			requestId,
			dto,
		);
	}

	@Roles(Role.STUDENT)
	@Delete(':requestId')
	async cancelRequest(
		@Req() req: Request,
		@Param('requestId') requestId: string,
	) {
		const user = req.user as UserPayload;
		return await this.requestsService.cancelRequest(user.id, requestId);
	}

	@Roles(Role.STUDENT)
	@Get(':requestId')
	async findOne(@Req() req: Request, @Param('requestId') requestId: string) {
		const user = req.user as UserPayload;
		return await this.requestsService.findOne(user.id, requestId);
	}
}
