import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
} from '@nestjs/common';

import { ChecklistItemService } from './checklist-item.service';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

@Controller('checklist-item')
export class ChecklistItemController {
	constructor(private readonly checklistItemService: ChecklistItemService) {}

	@Post()
	create(@Body() createChecklistItemDto: CreateChecklistItemDto) {
		return this.checklistItemService.create(createChecklistItemDto);
	}

	@Get()
	findAll() {
		return this.checklistItemService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.checklistItemService.findOne(+id);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() updateChecklistItemDto: UpdateChecklistItemDto,
	) {
		return this.checklistItemService.update(+id, updateChecklistItemDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.checklistItemService.remove(+id);
	}
}
