import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAccessAuthGuard, RoleGuard } from '@/auth';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { GROUP_API_TAGS, GROUP_CONSTANTS } from '@/groups/constants';
import { GroupPublicDocs } from '@/groups/docs';
import { GroupPublicService } from '@/groups/services';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags(GROUP_API_TAGS)
@Controller(GROUP_CONSTANTS.BASE)
export class GroupPublicController {
	constructor(private readonly service: GroupPublicService) {}

	@HttpCode(HttpStatus.OK)
	@Get()
	@ApiOperation(GroupPublicDocs.findAll)
	async findAll() {
		return await this.service.findAll();
	}

	@HttpCode(HttpStatus.OK)
	@Get('student')
	@ApiOperation(GroupPublicDocs.findDetailedByStudentId)
	async findMyGroups(@Req() req: Request) {
		const user = req.user as UserPayload;

		return await this.service.findDetailedByStudentId(user.id);
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id')
	@ApiOperation(GroupPublicDocs.findOne)
	async findOne(@Param('id') id: string) {
		return await this.service.findOne(id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('student/:studentId')
	@ApiOperation(GroupPublicDocs.findDetailedByStudentId)
	async findByStudentId(@Param('studentId') studentId: string) {
		return await this.service.findDetailedByStudentId(studentId);
	}

	@HttpCode(HttpStatus.OK)
	@Get(':id/members')
	@ApiOperation(GroupPublicDocs.findGroupMembers)
	async findGroupMembers(@Param('id') id: string) {
		return await this.service.findGroupMembers(id);
	}
}
