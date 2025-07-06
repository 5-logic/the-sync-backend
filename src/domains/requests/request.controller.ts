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
import { RequestService } from '@/domains/requests/request.service';
import {
	CreateInviteRequestDto,
	CreateJoinRequestDto,
	UpdateRequestStatusDto,
} from '@/requests/dto';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Requests')
@Controller('requests')
export class RequestController {
	constructor(private readonly requestsService: RequestService) {}

	@Roles(Role.STUDENT)
	@ApiOperation({
		summary: 'Send a join request to a group',
		description:
			'Allows a student to send a request to join a specific group. The student must be enrolled in the same semester and not already in another group. Group capacity and semester status are validated.',
	})
	@Post('join')
	async createJoinRequest(
		@Req() req: Request,
		@Body() dto: CreateJoinRequestDto,
	) {
		const user = req.user as UserPayload;
		return await this.requestsService.createJoinRequest(user.id, dto);
	}

	@Roles(Role.STUDENT)
	@ApiOperation({
		summary: 'Send invite requests to multiple students',
		description:
			'Allows a group leader to send invitation requests to multiple students to join their group. Only group leaders can send invites. Validates group capacity, student enrollment status, and semester phase.',
	})
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
	@ApiOperation({
		summary: 'Get all requests for current student',
		description:
			'Retrieves all requests (both sent and received) for the authenticated student. Includes join requests sent by the student and invite requests received from groups.',
	})
	@Get('student')
	async getStudentRequests(@Req() req: Request) {
		const user = req.user as UserPayload;
		return await this.requestsService.getStudentRequests(user.id);
	}

	@Roles(Role.STUDENT)
	@ApiOperation({
		summary: 'Get all requests for a specific group',
		description:
			'Retrieves all requests related to a specific group. Only accessible by the group leader. Includes both join requests from students and invite requests sent by the group.',
	})
	@Get('group/:groupId')
	async getGroupRequests(
		@Req() req: Request,
		@Param('groupId') groupId: string,
	) {
		const user = req.user as UserPayload;
		return await this.requestsService.getGroupRequests(user.id, groupId);
	}

	@Roles(Role.STUDENT)
	@ApiOperation({
		summary: 'Approve or reject a request',
		description:
			'Updates the status of a request (approve/reject). For join requests, only group leaders can respond. For invite requests, only the invited student can respond. Approved requests automatically add the student to the group.',
	})
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
	@ApiOperation({
		summary: 'Cancel a pending request',
		description:
			'Allows a student to cancel their own pending request. Only the student who originally sent the request can cancel it. Only pending requests can be cancelled.',
	})
	@Delete(':requestId')
	async cancelRequest(
		@Req() req: Request,
		@Param('requestId') requestId: string,
	) {
		const user = req.user as UserPayload;
		return await this.requestsService.cancelRequest(user.id, requestId);
	}

	@Roles(Role.STUDENT)
	@ApiOperation({
		summary: 'Get details of a specific request',
		description:
			'Retrieves detailed information about a specific request by ID. Only accessible by the student who sent the request or the group leader of the target group.',
	})
	@Get(':requestId')
	async findOne(@Req() req: Request, @Param('requestId') requestId: string) {
		const user = req.user as UserPayload;
		return await this.requestsService.findOne(user.id, requestId);
	}
}
