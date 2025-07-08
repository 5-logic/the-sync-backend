import { Injectable } from '@nestjs/common';

import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

@Injectable()
export class ChecklistItemService {
	create(createChecklistItemDto: CreateChecklistItemDto) {
		return 'This action adds a new checklistItem';
	}

	findAll() {
		return `This action returns all checklistItem`;
	}

	findOne(id: number) {
		return `This action returns a #${id} checklistItem`;
	}

	update(id: number, updateChecklistItemDto: UpdateChecklistItemDto) {
		return `This action updates a #${id} checklistItem`;
	}

	remove(id: number) {
		return `This action removes a #${id} checklistItem`;
	}
}
