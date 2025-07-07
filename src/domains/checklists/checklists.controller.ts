import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
} from '@nestjs/common';

import { ChecklistsService } from '@/checklists/checklists.service';
import { CreateChecklistDto } from '@/checklists/dto/create-checklist.dto';
import { UpdateChecklistDto } from '@/checklists/dto/update-checklist.dto';

@Controller('checklists')
export class ChecklistsController {
	constructor(private readonly checklistsService: ChecklistsService) {}

	@Post()
	create(@Body() createChecklistDto: CreateChecklistDto) {
		return this.checklistsService.create(createChecklistDto);
	}

	@Get()
	findAll() {
		return this.checklistsService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.checklistsService.findOne(+id);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() updateChecklistDto: UpdateChecklistDto,
	) {
		return this.checklistsService.update(+id, updateChecklistDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.checklistsService.remove(+id);
	}
}
