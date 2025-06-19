import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateGroupDto } from '@/groups/dto/create-group.dto';
import { UpdateGroupDto } from '@/groups/dto/update-group.dto';
import { GroupService } from '@/groups/group.service';

@ApiTags('Group')
@Controller('groups')
export class GroupController {
	constructor(private readonly groupService: GroupService) {}

	@Post()
	async create(@Body() createGroupDto: CreateGroupDto) {
		return await this.groupService.create(createGroupDto);
	}

	@Get()
	async findAll() {
		return await this.groupService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.groupService.findOne(id);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() updateGroupDto: UpdateGroupDto,
	) {
		return await this.groupService.update(id, updateGroupDto);
	}
}
