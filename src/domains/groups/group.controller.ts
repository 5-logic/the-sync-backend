import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';

import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { JwtAccessAuthGuard } from '@/auth/guards/jwt-access.guard';
import { RoleGuard } from '@/auth/guards/role.guard';
import { UserPayload } from '@/auth/interfaces/user-payload.interface';
import { CreateGroupDto, UpdateGroupDto } from '@/groups/dto';
import { GroupService } from '@/groups/group.service';

@UseGuards(JwtAccessAuthGuard, RoleGuard)
@ApiBearerAuth()
@ApiTags('Group')
@Controller('groups')
export class GroupController {
	constructor(private readonly groupService: GroupService) {}

	@Roles(Role.STUDENT)
	@Post()
	async create(@Req() request: FastifyRequest, @Body() dto: CreateGroupDto) {
		const user = request.user as UserPayload;

		return await this.groupService.create(user.id, dto);
	}

	@Get()
	async findAll() {
		return await this.groupService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.groupService.findOne(id);
	}

	@Roles(Role.STUDENT)
	@Put(':id')
	async update(
		@Req() request: FastifyRequest,
		@Param('id') id: string,
		@Body() dto: UpdateGroupDto,
	) {
		const user = request.user as UserPayload;

		return await this.groupService.update(id, user.id, dto);
	}
}
